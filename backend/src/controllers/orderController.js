// backend/src/controllers/orderController.js
const { sendOrderConfirmationEmail } = require('../services/emailService');

async function confirmOrder(req, res) {
    try {
        const orderDetails = req.body;
        console.log('Pedido confirmado:', orderDetails);
        
        // 1. Salvar o pedido no banco de dados (TODO: implementar)
        // Por enquanto, apenas logamos. A implementação real de DB viria aqui.

        // 2. Enviar e-mail de confirmação para o e-mail configurado
        await sendOrderConfirmationEmail(orderDetails);

        // 3. Notificar a cozinha/equipe de entrega (TODO: implementar)
        // 4. Integrar com outros sistemas (TODO: implementar)

        res.status(200).json({ message: 'Pedido confirmado com sucesso!' });
    } catch (error) {
        console.error('Erro ao confirmar pedido:', error);
        res.status(500).json({ error: 'Erro ao confirmar pedido.', details: error.message });
    }
}

module.exports = { confirmOrder };
