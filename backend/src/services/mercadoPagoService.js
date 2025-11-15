// backend/src/services/mercadoPagoService.js
const { MercadoPagoConfig, Preference } = require('mercadopago');

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

console.log('DEBUG: MercadoPagoService - Access Token:', accessToken ? 'Loaded' : 'MISSING');

if (!accessToken) {
    console.error('ERRO CRÍTICO: MERCADOPAGO_ACCESS_TOKEN não está configurado no arquivo .env do backend.');
    // Lançar um erro aqui impedirá que o módulo seja carregado, o que é desejável se o token for crítico.
    throw new Error('MERCADOPAGO_ACCESS_TOKEN is not defined for Mercado Pago service.');
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
            success: `${frontendUrl}/checkout?status=approved`,
            failure: `${frontendUrl}/checkout?status=rejected`,
            pending: `${frontendUrl}/checkout?status=pending`
        },
        auto_return: "approved",
    };

    const result = await preference.create({ body });
    return result;
}

module.exports = { createPaymentPreference };
