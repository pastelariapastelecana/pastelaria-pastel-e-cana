// backend/src/routes/paymentRoutes.js 
const express = require('express');
const router = express.Router();
const { processPayment, processTransparentCardPayment } = require('../controllers/paymentController');
const { generatePix } = require('../controllers/pixController');

router.post('/create-payment', processPayment);
router.post('/generate-pix', generatePix);
router.post('/process-transparent-card-payment', processTransparentCardPayment); // Nova rota para pagamento transparente

module.exports = router;
