const { getPaymentDetails } = require('../services/mercadoPagoService');
const { sendOrderConfirmationEmail } = require('../services/emailService.js'); // Adicionando .js explicitamente

async function handleMercadoPagoWebhook(req, res) {
    const notificationType = req.body.type;
    const paymentId = req.body.data?.id;

    if (!paymentId || !notificationType) {
        console.warn('Webhook recebido sem paymentId ou notificationType:', req.body);
        return res.status(400).send('paymentId e notificationType são obrigatórios.');
    }

    console.log(`[Webhook] Recebido evento do Mercado Pago: Payment ID=${paymentId}, Tipo=${notificationType}`);

    try {
        if (notificationType === 'payment') {
            const paymentDetails = await getPaymentDetails(paymentId);

            if (!paymentDetails) {
                console.warn(`[Webhook] Detalhes do pagamento não encontrados para ID: ${paymentId}. Ignorando notificação.`);
                // Retorna 200 OK mesmo que o pagamento não seja encontrado, conforme boas práticas de webhook
                return res.status(200).send('Payment not found, notification ignored.');
            }

            console.log(`[Webhook] Status do pagamento para ID ${paymentId}: ${paymentDetails.status}`);

            if (paymentDetails.status === 'approved') {
                // Garante que payer e suas propriedades existam antes de acessá-las
                const payerName = (paymentDetails.payer?.first_name || '') + ' ' + (paymentDetails.payer?.last_name || '');
                const payerEmail = paymentDetails.payer?.email || 'email_nao_disponivel@example.com';

                const placeholderOrderDetails = {
                    items: [{ name: 'Pedido via Mercado Pago IPN', quantity: 1, price: paymentDetails.transaction_amount }],
                    deliveryDetails: { address: 'Endereço não disponível via IPN', number: 'N/A', neighborhood: 'N/A', city: 'N/A', zipCode: 'N/A' },
                    deliveryFee: 0,
                    totalPrice: paymentDetails.transaction_amount,
                    totalWithDelivery: paymentDetails.transaction_amount,
                    paymentMethod: 'Mercado Pago Checkout Pro (IPN)',
                    payerName: payerName.trim() || 'Cliente Desconhecido', // Fallback se o nome estiver vazio
                    payerEmail: payerEmail,
                    orderDate: new Date().toISOString(),
                    paymentId: paymentDetails.id,
                };

                await sendOrderConfirmationEmail(placeholderOrderDetails);
                console.log(`[Webhook] E-mail de confirmação enviado para o pedido com ID de pagamento ${paymentId}.`);
            } else {
                console.log(`[Webhook] Pagamento ID ${paymentId} não aprovado. Status: ${paymentDetails.status}`);
                // TODO: Lógica para pagamentos pendentes, rejeitados, etc.
            }
        } else {
            console.log(`[Webhook] Tópico ${notificationType} não é um evento de pagamento. Ignorando.`);
        }

        res.status(200).send('Webhook processado com sucesso.');
    } catch (error) {
        console.error(`[Webhook] Erro inesperado ao processar webhook para ID ${paymentId}:`, error.message);
        res.status(500).send('Erro interno ao processar webhook.');
    }
}

module.exports = { handleMercadoPagoWebhook };
