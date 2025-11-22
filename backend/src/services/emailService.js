const sgMail = require('@sendgrid/mail');

// Check for required environment variables
const sendgridApiKey = process.env.SENDGRID_API_KEY;
const senderEmail = process.env.SENDER_EMAIL; // O e-mail verificado no SendGrid
const orderRecipientEmail = 'pedidos@pastelariapastelecana.com.br'; // Hardcoded recipient

if (!sendgridApiKey || !senderEmail) {
    const missingVars = [];
    if (!sendgridApiKey) missingVars.push('SENDGRID_API_KEY');
    if (!senderEmail) missingVars.push('SENDER_EMAIL');
    console.error(`ERRO CRÍTICO: Variáveis de ambiente do SendGrid ausentes no backend: ${missingVars.join(', ')}`);
    throw new Error(`Configuração de e-mail incompleta. Variáveis ausentes: ${missingVars.join(', ')}`);
}

sgMail.setApiKey(sendgridApiKey);

async function sendOrderConfirmationEmail(orderDetails) {
    const { items, deliveryDetails, deliveryFee, totalPrice, totalWithDelivery, paymentMethod, payerName, payerEmail, orderDate, paymentId } = orderDetails;

    const itemDetails = items.map(item => `
        <li>${item.name} (x${item.quantity}) - R$ ${item.price.toFixed(2)} cada</li>
    `).join('');

    const emailContent = `
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

    const msg = {
        to: orderRecipientEmail,
        from: senderEmail, // Deve ser um e-mail verificado no SendGrid
        subject: `Novo Pedido Recebido - #${new Date(orderDate).getTime()} ${paymentId ? `(MP ID: ${paymentId})` : ''}`,
        html: emailContent,
    };

    try {
        await sgMail.send(msg);
        console.log('E-mail de confirmação de pedido enviado com sucesso via SendGrid!');
    } catch (error) {
        console.error('Erro ao enviar e-mail de confirmação de pedido via SendGrid:', error.response ? error.response.body : error.message);
        throw new Error('Falha ao enviar e-mail de confirmação via SendGrid.');
    }
}

module.exports = { sendOrderConfirmationEmail };
