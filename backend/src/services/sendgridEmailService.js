// backend/src/services/sendgridEmailService.js
// Este arquivo é um fallback para módulos que ainda referenciam o antigo serviço SendGrid.
// Ele redireciona para o serviço de e-mail baseado em Nodemailer/SMTP.
const { sendOrderConfirmationEmail } = require('./emailService.js');

module.exports = { sendOrderConfirmationEmail };
