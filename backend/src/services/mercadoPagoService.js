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
            success: `${frontendUrl}/`, // Alterado para a página inicial
            failure: `${frontendUrl}/pagamento/falha`,
            pending: `${frontendUrl}/pagamento/pendente`
        },
        auto_return: "approved",
    };

    const result = await preference.create({ body });
    return result;
}

async function createCardPayment(paymentData) {
    const payment = new Payment(client);
    const body = {
        transaction_amount: paymentData.transaction_amount,
        token: paymentData.token,
        description: paymentData.description,
        installments: paymentData.installments,
        payment_method_id: paymentData.payment_method_id,
        issuer_id: paymentData.issuer_id,
        payer: {
            email: paymentData.payer.email,
            first_name: paymentData.payer.first_name,
            last_name: paymentData.payer.last_name,
            identification: {
                type: paymentData.payer.identification.type,
                number: paymentData.payer.identification.number,
            },
        },
    };

    const result = await payment.create({ body });
    return result;
}

module.exports = { createPaymentPreference, createCardPayment };
