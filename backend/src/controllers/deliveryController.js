// backend/src/controllers/deliveryController.js
const { calculateDistance } = require('../services/mapsService');

async function getDeliveryFee(req, res) {
    try {
        const { origin, destination } = req.body; // Ex: origin = "Endereço da loja", destination = "Endereço do cliente"
        const distanceInKm = await calculateDistance(origin, destination);

        // Lógica de preço: Ex: R$ 2.00 base + R$ 2.00 por km
        const baseFee = 2.00; // Taxa base alterada para R$ 2,00
        const feePerKm = 2.00;
        const deliveryFee = baseFee + (distanceInKm * feePerKm);

        res.json({ distanceInKm, deliveryFee: parseFloat(deliveryFee.toFixed(2)) });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao calcular a taxa de entrega' });
    }
}

module.exports = { getDeliveryFee };
