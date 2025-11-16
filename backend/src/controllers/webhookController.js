const { getPaymentDetails } = require('../services/mercadoPagoService');
const { sendOrderConfirmationEmail } = require('../services/emailService');

async function handleMercadoPagoWebhook(req, res) {
    const { id, topic } = req.body;

    if (!id || !topic) {
        console.warn('Webhook recebido sem ID ou tópico:', req.body);
        return res.status(400).send('ID e tópico são obrigatórios.');
    }

    console.log(`[Webhook] Recebido evento do Mercado Pago: ID=${id}, Tópico=${topic}`);

    try {
        if (topic === 'payment') {
            const paymentDetails = await getPaymentDetails(id);

            if (!paymentDetails) {
                console.error(`[Webhook] Detalhes do pagamento não encontrados para ID: ${id}`);
                return res.status(404).send('Detalhes do pagamento não encontrados.');
            }

            console.log(`[Webhook] Status do pagamento para ID ${id}: ${paymentDetails.status}`);

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
                console.log(`[Webhook] E-mail de confirmação enviado para o pedido com ID de pagamento ${id}.`);
            } else {
                console.log(`[Webhook] Pagamento ID ${id} não aprovado. Status: ${paymentDetails.status}`);
                // TODO: Lógica para pagamentos pendentes, rejeitados, etc.
                // Ex: Atualizar status do pedido no DB.
            }
        } else {
            console.log(`[Webhook] Tópico ${topic} não é um evento de pagamento. Ignorando.`);
        }

        res.status(200).send('Webhook processado com sucesso.');
    } catch (error) {
        console.error(`[Webhook] Erro ao processar webhook para ID ${id}:`, error.message);
        res.status(500).send('Erro interno ao processar webhook.');
    }
}

module.exports = { handleMercadoPagoWebhook };
