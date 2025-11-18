const nodemailer = require('nodemailer');

// Check for all required environment variables
const emailHost = process.env.EMAIL_HOST;
const emailPort = process.env.EMAIL_PORT;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const orderRecipientEmail = process.env.ORDER_RECIPIENT_EMAIL;

if (!emailHost || !emailPort || !emailUser || !emailPass || !orderRecipientEmail) {
    const missingVars = [];
    if (!emailHost) missingVars.push('EMAIL_HOST');
    if (!emailPort) missingVars.push('EMAIL_PORT');
    if (!emailUser) missingVars.push('EMAIL_USER');
    if (!emailPass) missingVars.push('EMAIL_PASS');
    if (!orderRecipientEmail) missingVars.push('ORDER_RECIPIENT_EMAIL');
    console.error(`ERRO CRÍTICO: Variáveis de ambiente de e-mail ausentes no backend: ${missingVars.join(', ')}`);
    throw new Error(`Configuração de e-mail incompleta. Variáveis ausentes: ${missingVars.join(', ')}`);
}

const transporter = nodemailer.createTransport({
    host: emailHost,
    port: parseInt(emailPort),
    secure: emailPort === '465', // true for 465, false for other ports like 587
    auth: {
        user: emailUser,
        pass: emailPass,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

async function sendOrderConfirmationEmail(orderDetails) {
    const { items, deliveryDetails, deliveryFee, totalPrice, totalWithDelivery, paymentMethod, payerName, payerEmail, orderDate } = orderDetails;

    const itemDetails = items.map(item => `
        <li>${item.name} (x${item.quantity}) - R$ ${item.price.toFixed(2)} cada</li>
    `).join('');

    const emailContent = `
        <h1>Novo Pedido Recebido!</h1>
        <p>Um novo pedido foi finalizado com sucesso em ${new Date(orderDate).toLocaleString('pt-BR')}.</p>
        
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

    const mailOptions = {
        from: emailUser,
        to: orderRecipientEmail,
        subject: `Novo Pedido Recebido - #${new Date(orderDate).getTime()}`,
        html: emailContent,
    };

    try {
        console.log(`[EmailService] Tentando enviar e-mail para ${orderRecipientEmail} de ${emailUser}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('[EmailService] E-mail de confirmação de pedido enviado com sucesso!', info.messageId);
        console.log('[EmailService] Preview URL: %s', nodemailer.getTestMessageUrl(info)); // Apenas para contas de teste
    } catch (error) {
        console.error('[EmailService] Erro ao enviar e-mail de confirmação de pedido:', error);
        throw new Error('Falha ao enviar e-mail de confirmação.');
    }
}

module.exports = { sendOrderConfirmationEmail };
