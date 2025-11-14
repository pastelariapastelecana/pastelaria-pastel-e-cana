// backend/src/controllers/paymentController.js
const { createPaymentPreference, createPixPayment, createCardPayment } = require('../services/mercadoPagoService');

console.log('DEBUG: paymentController.js carregado.');
console.log('DEBUG: typeof createPaymentPreference:', typeof createPaymentPreference);
console.log('DEBUG: typeof createPixPayment:', typeof createPixPayment);
console.log('DEBUG: typeof createCardPayment:', typeof createCardPayment);

async function processPayment(req, res) {
    try {
        const { items, payer } = req.body;
        const preference = await createPaymentPreference(items, payer);
        res.json({ id: preference.id, init_point: preference.init_point });
    } catch (error) {
        console.error('Erro ao criar preferência de pagamento:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Erro ao criar preferência de pagamento', details: error.response ? error.response.data : error.message });
    }
}

async function processPixPayment(req, res) {
    try {
        const { payerEmail, payerName, totalAmount } = req.body;
        const pixPayment = await createPixPayment(payerEmail, payerName, totalAmount);
        
        if (pixPayment && pixPayment.point_of_interaction && pixPayment.point_of_interaction.transaction_data) {
            res.json({
                id: pixPayment.id,
                status: pixPayment.status,
                qr_code_base64: pixPayment.point_of_interaction.transaction_data.qr_code_base64,
                qr_code: pixPayment.point_of_interaction.transaction_data.qr_code,
                ticket_url: pixPayment.point_of_interaction.transaction_data.ticket_url,
            });
        } else {
            throw new Error('Dados do PIX QR Code não encontrados na resposta do Mercado Pago.');
        }
    } catch (error) {
        console.error('Erro ao criar pagamento PIX:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Erro ao criar pagamento PIX', details: error.response ? error.response.data : error.message });
    }
}

async function processTransparentCardPayment(req, res) {
    try {
        const paymentData = req.body;
        const result = await createCardPayment(paymentData);
        res.json(result);
    } catch (error) {
        console.error('Erro ao processar pagamento transparente com cartão:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Erro ao processar pagamento com cartão', details: error.response ? error.response.data : error.message });
    }
}

module.exports = { processPayment, processPixPayment, processTransparentCardPayment };
