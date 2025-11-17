const { getPaymentDetails } = require('../services/mercadoPagoService');
const { sendOrderConfirmationEmail } = require('../services/emailService');

async function handleMercadoPagoWebhook(req, res) {
    // O ID do pagamento está em req.body.data.id e o tópico em req.body.type
    const notificationType = req.body.type;
    const paymentId = req.body.data?.id; // Usamos optional chaining para garantir que 'data' existe

    if (!paymentId || !notificationType) {
        console.warn('Webhook recebido sem paymentId ou notificationType:', req.body);
        return res.status(400).send('paymentId e notificationType são obrigatórios.');
    }

    console.log(`[Webhook] Recebido evento do Mercado Pago: Payment ID=${paymentId}, Tipo=${notificationType}`);

    try {
        if (notificationType === 'payment') {
            const paymentDetails = await getPaymentDetails(paymentId);

            if (!paymentDetails) {
                console.error(`[Webhook] Detalhes do pagamento não encontrados para ID: ${paymentId}`);
                return res.status(404).send('Detalhes do pagamento não encontrados.');
            }

            console.log(`[Webhook] Status do pagamento para ID ${paymentId}: ${paymentDetails.status}`);

            if (paymentDetails.status === 'approved') {
                // TODO: Em uma aplicação real, você buscaria os detalhes completos do pedido
                // do seu banco de dados usando o `paymentDetails.external_reference`
                // ou um `orderId` que você associou ao pagamento quando a preferência foi criada.
                // Por exemplo: const order = await Order.findByPaymentId(paymentDetails.id);
                // E então passaria `order` para `sendOrderConfirmationEmail`.

                // Para fins de demonstração sem um banco de dados, vamos criar um placeholder
                // com base nas informações do pagamento para enviar o e-mail.
                const placeholderOrderDetails = {
                    items: [{ name: 'Pedido via Mercado Pago IPN', quantity: 1, price: paymentDetails.transaction_amount }],
                    deliveryDetails: { address: 'Endereço não disponível via IPN', number: 'N/A', neighborhood: 'N/A', city: 'N/A', zipCode: 'N/A' },
                    deliveryFee: 0, // Assumindo 0, pois detalhes de frete não vêm no IPN de pagamento
                    totalPrice: paymentDetails.transaction_amount,
                    totalWithDelivery: paymentDetails.transaction_amount,
                    paymentMethod: 'Mercado Pago Checkout Pro (IPN)',
                    payerName: paymentDetails.payer.first_name + ' ' + (paymentDetails.payer.last_name || ''),
                    payerEmail: paymentDetails.payer.email,
                    orderDate: new Date().toISOString(),
                    paymentId: paymentDetails.id,
                };

                await sendOrderConfirmationEmail(placeholderOrderDetails);
                console.log(`[Webhook] E-mail de confirmação enviado para o pedido com ID de pagamento ${paymentId}.`);
            } else {
                console.log(`[Webhook] Pagamento ID ${paymentId} não aprovado. Status: ${paymentDetails.status}`);
                // TODO: Lógica para pagamentos pendentes, rejeitados, etc.
                // Ex: Atualizar status do pedido no DB.
            }
        } else {
            console.log(`[Webhook] Tópico ${notificationType} não é um evento de pagamento. Ignorando.`);
        }

        res.status(200).send('Webhook processado com sucesso.');
    } catch (error) {
        console.error(`[Webhook] Erro ao processar webhook para ID ${paymentId}:`, error.message);
        res.status(500).send('Erro interno ao processar webhook.');
    }
}

module.exports = { handleMercadoPagoWebhook };
}

module.exports = { handleMercadoPagoWebhook };
