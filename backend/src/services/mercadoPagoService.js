// backend/src/services/mercadoPagoService.js
const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

async function createPaymentPreference(items, payer) {
    const preference = new Preference(client);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const body = {
        items: items, // Já deve incluir a taxa de entrega se houver
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
        // notification_url: `${process.env.BACKEND_URL}/api/webhook/mercadopago`, // Opcional: para receber notificações de status de pagamento
    };

    const result = await preference.create({ body });
    return result;
}

module.exports = { createPaymentPreference };
