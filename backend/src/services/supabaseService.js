const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase ausentes no backend. Certifique-se de configurar SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
    // Não lançamos um erro fatal aqui para permitir que o servidor inicie, mas a função de inserção falhará.
}

const supabase = supabaseUrl && supabaseServiceRoleKey 
    ? createClient(supabaseUrl, supabaseServiceRoleKey) 
    : null;

async function insertOrder(orderDetails) {
    if (!supabase) {
        console.error('Supabase client não inicializado. Verifique as variáveis de ambiente.');
        throw new Error('Supabase indisponível.');
    }

    // Estrutura de dados para a tabela 'orders'
    const orderData = {
        payment_id: orderDetails.paymentId,
        payer_name: orderDetails.payerName,
        payer_email: orderDetails.payerEmail,
        total_amount: orderDetails.totalWithDelivery,
        delivery_fee: orderDetails.deliveryFee,
        delivery_address: `${orderDetails.deliveryDetails.address}, ${orderDetails.deliveryDetails.number}, ${orderDetails.deliveryDetails.neighborhood}, ${orderDetails.deliveryDetails.city} - ${orderDetails.deliveryDetails.zipCode}`,
        payment_method: orderDetails.paymentMethod,
        items_json: JSON.stringify(orderDetails.items), // Salva os itens como JSON
        status: 'approved', // Assumimos 'approved' pois vem do fluxo de sucesso do MP
        order_date: orderDetails.orderDate,
    };

    const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select();

    if (error) {
        console.error('Erro ao inserir pedido no Supabase:', error);
        throw new Error(`Falha ao salvar pedido no banco de dados: ${error.message}`);
    }

    console.log('Pedido salvo no Supabase com sucesso. ID:', data[0].id);
    return data[0];
}

module.exports = { insertOrder };
