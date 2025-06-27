// test-email.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const testEmailConfig = async () => {
  console.log('🧪 Probando configuración de email...');
  console.log('📧 Usuario:', 'info@examenestransversales.cl');
  console.log(
    '🔑 Password configurado:',
    process.env.EMAIL_PASSWORD ? 'Sí' : 'No'
  );

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'info@examenestransversales.cl',
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Verificar conexión
    console.log('🔄 Verificando conexión SMTP...');
    await transporter.verify();
    console.log('✅ Conexión SMTP exitosa');

    // Enviar email de prueba
    console.log('📤 Enviando email de prueba...');
    const info = await transporter.sendMail({
      from: 'info@examenestransversales.cl',
      to: 'info@examenestransversales.cl', // Enviar a la misma cuenta para prueba
      subject: 'Prueba de Configuración - Sistema de Gestión de Exámenes',
      html: `
        <h2>✅ Configuración de Email Exitosa</h2>
        <p>Si recibes este email, la configuración de nodemailer está funcionando correctamente.</p>
        <p><strong>Fecha de prueba:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <small>Sistema de Gestión de Exámenes Transversales</small>
      `,
    });

    console.log('✅ Email enviado exitosamente');
    console.log('📧 Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error en configuración de email:');
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);

    if (error.code === 'EAUTH') {
      console.log('\n🔧 Posibles soluciones:');
      console.log('1. Verificar que la cuenta tenga 2FA habilitado');
      console.log('2. Generar nueva contraseña de aplicación en:');
      console.log('   https://myaccount.google.com/apppasswords');
      console.log('3. Verificar que el email sea correcto');
    }
  }
};

testEmailConfig();
