// backend/src/services/mapsService.js
const axios = require('axios');

async function calculateDistance(origin, destination) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error('Erro: GOOGLE_MAPS_API_KEY não está configurada no arquivo .env do backend.');
        throw new Error('Chave da API do Google Maps ausente no backend.');
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origin}&destinations=${destination}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data.status === 'OK' && data.rows && data.rows.length > 0 && data.rows[0].elements && data.rows[0].elements.length > 0 && data.rows[0].elements[0].status === 'OK') {
            const distanceInMeters = data.rows[0].elements[0].distance.value;
            return distanceInMeters / 1000; // Retorna a distância em km
        } else {
            // Log detalhado da resposta da API do Google Maps se não for OK
            console.error('Google Maps API retornou um status não OK ou dados inválidos:', data);
            throw new Error(`Google Maps API retornou status: ${data.status || 'UNKNOWN'} - ${data.error_message || 'Verifique o console do backend para mais detalhes.'}`);
        }
    } catch (error) {
        console.error('Erro ao calcular a distância (catch):', error);
        // Log mais detalhes se for um erro do Axios (ex: erro de rede, 4xx/5xx)
        if (axios.isAxiosError(error) && error.response) {
            console.error('Resposta de erro da API do Google Maps (Axios):', error.response.data);
        }
        throw error;
    }
}

module.exports = { calculateDistance };