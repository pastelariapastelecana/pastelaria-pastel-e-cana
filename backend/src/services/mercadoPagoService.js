// backend/src/services/mercadoPagoService.js
const { MercadoPagoConfig, Preference } = require('mercadopago');

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!accessToken) {
    console.error('ERRO CRÍTICO: MERCADOPAGO_ACCESS_TOKEN não está configurado no arquivo .env do backend.');
    throw new Error('MERCADOPAGO_ACCESS_TOKEN is not defined.');
}

const client = new MercadoPagoConfig({ accessToken });

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
            success: `${frontendUrl}/pagamento/sucesso?status=approved`,
            failure: `${frontendUrl}/pagamento/sucesso?status=rejected`, // Redireciona para a mesma página, mas com status diferente
            pending: `${frontendUrl}/pagamento/sucesso?status=pending`
        },
        auto_return: "approved",
        // Opcional: external_reference para rastreamento do pedido
        // external_reference: 'YOUR_ORDER_ID',
    };

    const result = await preference.create({ body });
    return result;
}

// As funções createPixPayment e createCardPayment foram removidas,
// pois o Checkout Pro do Mercado Pago lida com PIX e cartões diretamente.

module.exports = { createPaymentPreference };
