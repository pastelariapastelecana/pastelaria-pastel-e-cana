// backend/src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { processPayment } = require('../controllers/paymentController');

console.log('DEBUG: paymentRoutes.js - processPayment:', typeof processPayment, processPayment); // Debug log

router.post('/create-payment', processPayment);

module.exports = router;
