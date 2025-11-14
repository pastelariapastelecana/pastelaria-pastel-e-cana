const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'), // Porta padrão para TLS/STARTTLS
    secure: process.env.EMAIL_PORT === '465', // true para 465, false para outras portas como 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        // Não rejeitar certificados autoassinados. Em produção, use certificados válidos.
        rejectUnauthorized: false, 
    },
});

async function sendOrderConfirmationEmail(orderDetails) {
    const recipientEmail = process.env.ORDER_RECIPIENT_EMAIL;
    if (!recipientEmail) {
        console.error('ORDER_RECIPIENT_EMAIL não está configurado no .env do backend.');
        throw new Error('E-mail do destinatário do pedido não configurado.');
    }

    const { items, deliveryDetails, deliveryFee, totalPrice, paymentMethod } = orderDetails;

    const itemDetails = items.map(item => `
        <li>${item.name} (x${item.quantity}) - R$ ${item.price.toFixed(2)} cada</li>
    `).join('');

    const emailContent = `
        <h1>Novo Pedido Recebido!</h1>
        <p>Um novo pedido foi finalizado com sucesso.</p>
        
        <h2>Detalhes do Cliente e Entrega:</h2>
        <p><strong>Endereço:</strong> ${deliveryDetails.address}, ${deliveryDetails.number}, ${deliveryDetails.neighborhood}, ${deliveryDetails.city} - ${deliveryDetails.zipCode}</p>
        <p><strong>Taxa de Entrega:</strong> R$ ${deliveryFee ? deliveryFee.toFixed(2) : '0.00'}</p>

        <h2>Itens do Pedido:</h2>
        <ul>
            ${itemDetails}
        </ul>

        <h2>Resumo do Pagamento:</h2>
        <p><strong>Subtotal:</strong> R$ ${totalPrice.toFixed(2)}</p>
        <p><strong>Total com Frete:</strong> R$ ${(totalPrice + (deliveryFee || 0)).toFixed(2)}</p>
        <p><strong>Método de Pagamento:</strong> ${paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito/Débito (Mercado Pago)'}</p>

        <p>Por favor, prepare o pedido e organize a entrega.</p>
        <p>Atenciosamente,<br>Sua Pastelaria Pastel & Cana</p>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER, // O e-mail que enviará a notificação
        to: recipientEmail,
        subject: `Novo Pedido Recebido - #${new Date().getTime()}`, // Assunto único para cada pedido
        html: emailContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('E-mail de confirmação de pedido enviado com sucesso!');
    } catch (error) {
        console.error('Erro ao enviar e-mail de confirmação de pedido:', error);
        throw new Error('Falha ao enviar e-mail de confirmação.');
    }
}

module.exports = { sendOrderConfirmationEmail };