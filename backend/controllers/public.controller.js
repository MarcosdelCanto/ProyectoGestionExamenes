// backend/controllers/public.controller.js
import { getConnection } from '../db.js';
import oracledb from 'oracledb';

const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, ':', error);
  const details =
    error && error.message
      ? error.message
      : error
        ? String(error)
        : 'No hay detalles adicionales del error.';
  res.status(statusCode).json({ error: message, details: details });
};

export const consultarReservasPublico = async (req, res) => {
  let connection;
  const { identificador, tipoUsuario } = req.body; // tipoUsuario será 'alumno' o 'docente'

  if (!identificador || !tipoUsuario) {
    return handleError(
      res,
      null,
      'Identificador y tipo de usuario son requeridos.',
      400
    );
  }

  const ID_ROL_ALUMNO = 3;
  const ID_ROL_DOCENTE = 2;
  let targetRolId;

  if (tipoUsuario.toLowerCase() === 'alumno') {
    targetRolId = ID_ROL_ALUMNO;
  } else if (tipoUsuario.toLowerCase() === 'docente') {
    targetRolId = ID_ROL_DOCENTE;
  } else {
    return handleError(res, null, 'Tipo de usuario no válido.', 400);
  }

  try {
    connection = await getConnection();

    // 1. Buscar al usuario y verificar su rol
    const userSql = `
      SELECT ID_USUARIO, ROL_ID_ROL
      FROM USUARIO
      WHERE EMAIL_USUARIO = :identificador_param
      -- Si tienes RUT_USUARIO: OR RUT_USUARIO = :identificador_param
    `;
    const userResult = await connection.execute(
      userSql,
      { identificador_param: identificador.toLowerCase() },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (userResult.rows.length === 0) {
      return handleError(
        res,
        null,
        'Usuario no encontrado con el identificador proporcionado.',
        404
      );
    }

    const usuario = userResult.rows[0];
    if (usuario.ROL_ID_ROL !== targetRolId) {
      return handleError(
        res,
        null,
        `El identificador no corresponde a un ${tipoUsuario}.`,
        403
      );
    }

    // 2. Construir la consulta de reservas basada en el rol
    let sqlReservas;
    const paramsReservas = { userId_param: usuario.ID_USUARIO };

    let baseSelectReservas = `
      SELECT
        R.ID_RESERVA, R.FECHA_RESERVA,
        E.NOMBRE_EXAMEN,
        SEC.NOMBRE_SECCION, A.NOMBRE_ASIGNATURA,
        SL.NOMBRE_SALA,
        EST_R.NOMBRE_ESTADO AS ESTADO_RESERVA,
        R.ESTADO_CONFIRMACION_DOCENTE,
        U_DOC.NOMBRE_USUARIO AS NOMBRE_DOCENTE,
        (SELECT MIN(M.INICIO_MODULO) FROM RESERVAMODULO RM JOIN MODULO M ON RM.MODULO_ID_MODULO = M.ID_MODULO WHERE RM.RESERVA_ID_RESERVA = R.ID_RESERVA) AS HORA_INICIO,
        (SELECT MAX(M.FIN_MODULO) FROM RESERVAMODULO RM JOIN MODULO M ON RM.MODULO_ID_MODULO = M.ID_MODULO WHERE RM.RESERVA_ID_RESERVA = R.ID_RESERVA) AS HORA_FIN,
        (SELECT MIN(M.INICIO_MODULO) || ' - ' || MAX(M.FIN_MODULO) FROM RESERVAMODULO RM JOIN MODULO M ON RM.MODULO_ID_MODULO = M.ID_MODULO WHERE RM.RESERVA_ID_RESERVA = R.ID_RESERVA) AS HORARIO_RESERVA,
        CASE
          WHEN R.ESTADO_CONFIRMACION_DOCENTE = 'CONFIRMADO' THEN 'S'
          ELSE 'N'
        END AS CONFIRMACION_DOCENTE
      FROM RESERVA R
      JOIN EXAMEN E ON R.EXAMEN_ID_EXAMEN = E.ID_EXAMEN
      JOIN SECCION SEC ON E.SECCION_ID_SECCION = SEC.ID_SECCION
      JOIN ASIGNATURA A ON SEC.ASIGNATURA_ID_ASIGNATURA = A.ID_ASIGNATURA
      JOIN SALA SL ON R.SALA_ID_SALA = SL.ID_SALA
      JOIN ESTADO EST_R ON R.ESTADO_ID_ESTADO = EST_R.ID_ESTADO
      LEFT JOIN RESERVA_DOCENTES RD_DOC ON R.ID_RESERVA = RD_DOC.RESERVA_ID_RESERVA
      LEFT JOIN USUARIO U_DOC ON RD_DOC.USUARIO_ID_USUARIO = U_DOC.ID_USUARIO AND U_DOC.ROL_ID_ROL = 2
    `;

    if (usuario.ROL_ID_ROL === ID_ROL_ALUMNO) {
      // Para ALUMNOS: usar USUARIOSECCION para encontrar sus secciones
      sqlReservas = `
        ${baseSelectReservas}
        JOIN USUARIOSECCION US_ALU ON SEC.ID_SECCION = US_ALU.SECCION_ID_SECCION
        WHERE US_ALU.USUARIO_ID_USUARIO = :userId_param
          AND R.ESTADO_CONFIRMACION_DOCENTE = 'CONFIRMADO'
          AND EST_R.NOMBRE_ESTADO IN ('PROGRAMADO', 'CONFIRMADO')
        ORDER BY R.FECHA_RESERVA ASC, HORA_INICIO ASC
      `;
    } else if (usuario.ROL_ID_ROL === ID_ROL_DOCENTE) {
      // Para DOCENTES: usar RESERVA_DOCENTES para encontrar sus reservas asignadas
      sqlReservas = `
        ${baseSelectReservas}
        JOIN RESERVA_DOCENTES RD ON R.ID_RESERVA = RD.RESERVA_ID_RESERVA
        WHERE RD.USUARIO_ID_USUARIO = :userId_param
          AND R.ESTADO_CONFIRMACION_DOCENTE = 'CONFIRMADO'
          AND EST_R.NOMBRE_ESTADO IN ('PROGRAMADO', 'CONFIRMADO')
        ORDER BY R.FECHA_RESERVA ASC, HORA_INICIO ASC
      `;
    } else {
      // Este caso no debería darse si la validación de rol inicial es correcta
      return res.json([]);
    }

    const reservasResult = await connection.execute(
      sqlReservas,
      paramsReservas,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(reservasResult.rows);
  } catch (error) {
    handleError(res, error, 'Error al consultar reservas');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(
          'Error cerrando conexión en consultarReservasPublico',
          err
        );
      }
    }
  }
};

export const enviarPDFExamenesPorCorreo = async (req, res) => {
  try {
    const { email, tipoUsuario } = req.body;
    const pdfFile = req.file; // Multer manejará el archivo

    if (!email || !tipoUsuario || !pdfFile) {
      return res.status(400).json({
        error: 'Email, tipo de usuario y archivo PDF son requeridos.',
      });
    }

    // Importar nodemailer
    const nodemailer = await import('nodemailer');

    // Configurar transporter
    const transporter = nodemailer.default.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'info@examenestransversales.cl',
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Configurar opciones del correo
    const tipoUsuarioTexto = tipoUsuario === 'docente' ? 'Docente' : 'Alumno';
    const fechaActual = new Date().toLocaleDateString('es-CL');

    const mailOptions = {
      from: process.env.EMAIL_USER || 'info@examenestransversales.cl',
      to: email,
      subject: `Programación de Exámenes - ${tipoUsuarioTexto}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #003d7a 0%, #0056b3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <div style="background: #003d7a; color: white; padding: 15px; border-radius: 5px; display: inline-block; margin-bottom: 20px;">
              <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">
                DUOC UC
              </div>
              <div style="font-size: 16px;">
                Sistema de Gestión de Exámenes Transversales
              </div>
            </div>

            <h2 style="color: white; margin-bottom: 10px;">📅 Programación de Exámenes</h2>
            <p style="font-size: 16px; margin: 0;">Consulta generada desde el Tótem de Información</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #dee2e6; border-radius: 0 0 10px 10px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #003d7a; margin-bottom: 15px;">📋 Información de la Consulta</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Tipo de Usuario:</td>
                  <td style="padding: 8px 0; color: #666;">${tipoUsuarioTexto}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Email:</td>
                  <td style="padding: 8px 0; color: #666;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Fecha de Consulta:</td>
                  <td style="padding: 8px 0; color: #666;">${fechaActual}</td>
                </tr>
              </table>
            </div>

            <div style="background: #e7f3ff; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; font-size: 16px; color: #004085;">
                <strong>📎 Archivo Adjunto:</strong> Encontrará su programación de exámenes en el archivo PDF adjunto a este correo.
              </p>
            </div>

            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; font-size: 14px; color: #155724;">
                <strong>💡 Tip:</strong> Guarde este PDF en su dispositivo o imprímalo para tener siempre disponible su horario de exámenes.
              </p>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

            <div style="text-align: center;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                Este correo fue generado automáticamente por el Sistema de Gestión de Exámenes Transversales
              </p>
              <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">
                <strong>DUOC UC</strong> - examenestransversales.cl
              </p>
            </div>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `examenes_${tipoUsuario}_${fechaActual.replace(/\//g, '-')}.pdf`,
          content: pdfFile.buffer,
          contentType: 'application/pdf',
        },
      ],
    };

    // Enviar correo
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      mensaje: 'PDF enviado exitosamente por correo.',
      email: email,
    });
  } catch (error) {
    console.error('Error al enviar PDF por correo:', error);
    return handleError(
      res,
      error,
      'Error al enviar el PDF por correo. Intente nuevamente.'
    );
  }
};
