// src/services/emailService.js

import api from './api';

/**
 * Envía un PDF por correo electrónico
 * @param {string} email - Email del destinatario
 * @param {Blob} pdfBlob - Blob del PDF generado
 * @param {string} tipoUsuario - Tipo de usuario (docente/alumno)
 * @returns {Promise} - Respuesta del servidor
 */
export const enviarPDFPorCorreo = async (email, pdfBlob, tipoUsuario) => {
  try {
    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('email', email);
    formData.append('tipoUsuario', tipoUsuario);
    formData.append(
      'pdf',
      pdfBlob,
      `examenes_${tipoUsuario}_${new Date().toISOString().split('T')[0]}.pdf`
    );

    const response = await api.post('/public/enviar-pdf-examenes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error al enviar PDF por correo:', error);
    throw error.response?.data || error;
  }
};
