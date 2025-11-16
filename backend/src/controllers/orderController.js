// backend/src/controllers/orderController.js
const { sendOrderConfirmationEmail } = require('../services/emailService');

async function confirmOrder(req, res) {
    try {
        const orderDetails = req.body;
        console.log('Pedido confirmado:', orderDetails);
        
        // 1. Salvar o pedido no banco de dados (TODO: Implementar)
        // Exemplo: await db.saveOrder(orderDetails);

        // 2. Enviar e-mail de confirmação para o lojista
        await sendOrderConfirmationEmail(orderDetails);

        // 3. Notificar a cozinha/equipe de entrega (TODO: Implementar)
        // 4. Integrar com outros sistemas (TODO: Implementar)

        res.status(200).json({ message: 'Pedido confirmado com sucesso!' });
    } catch (error) {
        console.error('Erro ao confirmar pedido:', error);
        res.status(500).json({ error: 'Erro ao confirmar pedido.', details: error.message });
    }
}

module.exports = { confirmOrder };
