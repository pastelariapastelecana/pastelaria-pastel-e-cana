// backend/src/controllers/orderController.js
const { sendOrderConfirmationEmail } = require('../services/emailService'); // Importar o serviço de e-mail

async function confirmOrder(req, res) {
    try {
        const orderDetails = req.body;
        console.log('Pedido confirmado recebido no backend:', orderDetails);

        // TODO: Aqui você pode adicionar a lógica para:
        // 1. Salvar o pedido no banco de dados (ex: await saveOrderToDatabase(orderDetails);)
        // 2. Notificar a cozinha/equipe de entrega (opcional)
        // 3. Integrar com outros sistemas (opcional)

        // Enviar e-mail de confirmação para o lojista
        await sendOrderConfirmationEmail(orderDetails);

        res.status(200).json({ message: 'Pedido confirmado com sucesso e e-mail enviado!' });
    } catch (error) {
        console.error('Erro ao confirmar pedido no backend:', error);
        res.status(500).json({ error: 'Erro ao confirmar pedido.', details: error.message });
    }
}

module.exports = { confirmOrder };
