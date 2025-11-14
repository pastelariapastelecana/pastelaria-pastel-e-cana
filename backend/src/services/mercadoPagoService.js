const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

// --- Verificações Explícitas de Variáveis de Ambiente ---
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!accessToken) {
    console.error('ERRO CRÍTICO: MERCADOPAGO_ACCESS_TOKEN não está configurado no arquivo .env do backend.');
    throw new Error('MERCADOPAGO_ACCESS_TOKEN é obrigatório para o serviço do Mercado Pago.');
}

const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
    console.error('ERRO CRÍTICO: FRONTEND_URL não está configurada no arquivo .env do backend.');
    throw new Error('FRONTEND_URL é obrigatória para o serviço do Mercado Pago (para redirecionamentos).');
}
// --- Fim das Verificações ---

const client = new MercadoPagoConfig({ accessToken });

async function createPaymentPreference(items, payer) {
    const preference = new Preference(client);

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
            // Para produção, você pode precisar de mais detalhes do pagador, como CPF e endereço.
            // "identification": {
            //     "type": "CPF",
            //     "number": "12345678909"
            // }
        },
        // Opcional: external_reference para rastreamento do pedido
        // external_reference: 'YOUR_ORDER_ID',
    };

    const result = await payment.create({ body });
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

module.exports = { createPaymentPreference, createPixPayment, createCardPayment };
