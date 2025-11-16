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
            success: `${frontendUrl}/checkout?status=approved`,
            failure: `${frontendUrl}/checkout?status=rejected`,
            pending: `${frontendUrl}/checkout?status=pending`
        },
        auto_return: "approved",
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

module.exports = { createPaymentPreference, createPixPayment };
