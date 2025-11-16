// backend/src/services/mercadoPagoService.js
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

async function createPaymentPreference(items, payer) {
    const preference = new Preference(client);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const body = {
        items: items,
        payer: {
            name: payer.name,
            email: payer.email,
        },
        back_urls: {
            success: `${frontendUrl}/pagamento/sucesso`,
            failure: `${frontendUrl}/pagamento/falha`,
            pending: `${frontendUrl}/pagamento/pendente`
        },
        auto_return: "approved",
        notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago`, // Adiciona o URL do webhook
    };

    const result = await preference.create({ body });
    return result;
}

async function createPixPayment(payerEmail, payerName, totalAmount) {
    const payment = new Payment(client);

    const body = {
        transaction_amount: parseFloat(totalAmount.toFixed(2)),
        description: 'Pagamento do pedido na Pastelaria Pastel & Cana',
        payment_method_id: 'pix',
        payer: {
            email: payerEmail,
            first_name: payerName,
        },
    };

    const result = await payment.create({ body });
    return result;
}

async function getPaymentDetails(paymentId) {
    const payment = new Payment(client);
    try {
        const result = await payment.get({ id: paymentId });
        return result;
    } catch (error) {
        console.error(`Erro ao buscar detalhes do pagamento ${paymentId} no Mercado Pago:`, error.message);
        throw error;
    }
}

module.exports = { createPaymentPreference, createPixPayment, getPaymentDetails };
