require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const deliveryRoutes = require('./src/routes/deliveryRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const orderRoutes = require('./src/routes/orderRoutes'); // Importar as novas rotas de pedido

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Habilita CORS para todas as origens
app.use(bodyParser.json()); // Analisa corpos de requisição JSON

// Rotas
app.use('/api/delivery', deliveryRoutes);
app.use('/api', paymentRoutes);
app.use('/api', orderRoutes); // Adicionar as novas rotas de pedido
console.log('Rotas de pagamento e pedido carregadas em /api'); // Adicionado para depuração

// Rota básica para testar se o servidor está funcionando
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});