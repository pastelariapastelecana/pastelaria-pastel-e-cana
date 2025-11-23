const formData = require('form-data');
const Mailgun = require('mailgun.js');

// Check for all required environment variables
const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const senderEmail = process.env.MAILGUN_SENDER_EMAIL;
const orderRecipientEmail = 'pedidos@pastelariapastelecana.com.br'; // Hardcoded recipient

if (!apiKey || !domain || !senderEmail) {
    const missingVars = [];
    if (!apiKey) missingVars.push('MAILGUN_API_KEY');
    if (!domain) missingVars.push('MAILGUN_DOMAIN');
    if (!senderEmail) missingVars.push('MAILGUN_SENDER_EMAIL');
    console.error(`ERRO CRÍTICO: Variáveis de ambiente do Mailgun ausentes no backend: ${missingVars.join(', ')}`);
    throw new Error(`Configuração de e-mail incompleta. Variáveis ausentes: ${missingVars.join(', ')}`);
}

const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: apiKey });

async function sendOrderConfirmationEmail(orderDetails) {
    const { items, deliveryDetails, deliveryFee, totalPrice, totalWithDelivery, paymentMethod, payerName, payerEmail, orderDate, paymentId } = orderDetails;

    const itemDetails = items.map(item => `
        <li>${item.name} (x${item.quantity}) - R$ ${item.price.toFixed(2)} cada</li>
    `).join('');

    const htmlContent = `
        <h1>Novo Pedido Recebido!</h1>
        <p>Um novo pedido foi finalizado com sucesso em ${new Date(orderDate).toLocaleString('pt-BR')}.</p>
        ${paymentId ? `<p><strong>ID do Pagamento (Mercado Pago):</strong> ${paymentId}</p>` : ''}
        
        <h2>Detalhes do Cliente:</h2>
        <p><strong>Nome:</strong> ${payerName}</p>
        <p><strong>E-mail:</strong> ${payerEmail}</p>

        <h2>Detalhes da Entrega:</h2>
        <p><strong>Endereço:</strong> ${deliveryDetails.address}, ${deliveryDetails.number}, ${deliveryDetails.neighborhood}, ${deliveryDetails.city} - ${deliveryDetails.zipCode}</p>
        <p><strong>Taxa de Entrega:</strong> R$ ${deliveryFee ? deliveryFee.toFixed(2) : '0.00'}</p>

        <h2>Itens do Pedido:</h2>
        <ul>
            ${itemDetails}
        </ul>

        <h2>Resumo do Pagamento:</h2>
        <p><strong>Subtotal dos Itens:</strong> R$ ${totalPrice.toFixed(2)}</p>
        <p><strong>Taxa de Entrega:</strong> R$ ${deliveryFee ? deliveryFee.toFixed(2) : '0.00'}</p>
        <p><strong>Total Geral:</strong> R$ ${totalWithDelivery.toFixed(2)}</p>
        <p><strong>Método de Pagamento:</strong> ${paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito/Débito (Mercado Pago)'}</p>

        <p>Por favor, prepare o pedido e organize a entrega.</p>
        <p>Atenciosamente,<br>Sua Pastelaria Pastel & Cana</p>
    `;

    const messageData = {
        from: senderEmail,
        to: orderRecipientEmail,
        subject: `Novo Pedido Recebido - #${new Date(orderDate).getTime()} ${paymentId ? `(MP ID: ${paymentId})` : ''}`,
        html: htmlContent,
    };

    try {
        await mg.messages.create(domain, messageData);
        console.log('E-mail de confirmação de pedido enviado com sucesso via Mailgun!');
    } catch (error) {
        console.error('Erro ao enviar e-mail de confirmação de pedido via Mailgun:', error);
        throw new Error('Falha ao enviar e-mail de confirmação via Mailgun.');
    }
}

module.exports = { sendOrderConfirmationEmail };
