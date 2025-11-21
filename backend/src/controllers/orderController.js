// backend/src/controllers/orderController.js
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { insertOrder } = require('../services/supabaseService'); // Importar o serviço Supabase

async function confirmOrder(req, res) {
    try {
        const orderDetails = req.body;
        console.log('Pedido confirmado recebido no backend:', orderDetails);

        // 1. Salvar o pedido no Supabase
        await insertOrder(orderDetails);
        
        // 2. Enviar e-mail de confirmação para o lojista
        await sendOrderConfirmationEmail(orderDetails);

        res.status(200).json({ message: 'Pedido confirmado com sucesso, salvo no Supabase e e-mail enviado!' });
    } catch (error) {
        console.error('Erro ao confirmar pedido no backend:', error);
        // Se a inserção no Supabase falhar, ainda tentamos responder ao cliente
        res.status(500).json({ error: 'Erro ao confirmar pedido.', details: error.message });
    }
}

module.exports = { confirmOrder };
