const { supabase } = require('../config/supabaseClient');
const { sendOrderConfirmationEmail } = require('../services/emailService');

async function confirmOrder(req, res) {
    try {
        const orderDetails = req.body;
        console.log('Pedido recebido para confirmação:', orderDetails);

        // 1. Salvar o pedido no banco de dados Supabase
        const { data, error } = await supabase
            .from('orders') // Nome da tabela no Supabase
            .insert([
                {
                    user_id: orderDetails.userId || null, // Se você tiver autenticação de usuário
                    items: orderDetails.items,
                    delivery_details: orderDetails.deliveryDetails,
                    delivery_fee: orderDetails.deliveryFee,
                    total_price: orderDetails.totalPrice,
                    payment_method: orderDetails.paymentMethod,
                    payer_name: orderDetails.payerName,
                    payer_email: orderDetails.payerEmail,
                    payment_id: orderDetails.paymentId || null, // ID do pagamento do Mercado Pago, se houver
                    status: 'pending', // Ou 'approved', 'processing', etc.
                }
            ])
            .select(); // Retorna os dados inseridos

        if (error) {
            console.error('Erro ao salvar pedido no Supabase:', error);
            return res.status(500).json({ error: 'Erro ao salvar pedido no banco de dados.' });
        }

        const savedOrder = data[0];
        console.log('Pedido salvo no Supabase com ID:', savedOrder.id);

        // 2. Enviar e-mail de confirmação para o destinatário configurado
        await sendOrderConfirmationEmail(orderDetails);

        res.status(200).json({ message: 'Pedido confirmado e salvo com sucesso!', orderId: savedOrder.id });
    } catch (error) {
        console.error('Erro ao confirmar pedido:', error);
        res.status(500).json({ error: 'Erro ao confirmar pedido.', details: error.message });
    }
}

module.exports = { confirmOrder };
