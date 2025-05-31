import React, { useState } from 'react';
import BulkUpload from '../components/cargaMasiva/BulkUpload';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import Layout from '../components/Layout';

const alertStyle = {
  position: 'fixed',
  top: '80px',
  right: '20px',
  zIndex: 1050,
  minWidth: '300px',
  animation: 'fadeInOut 5s ease-in-out forwards',
};

const keyframes = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(-20px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
  }
`;

function CargaDatosPage() {
  // pageLoading podría usarse si hay alguna preparación en CargaDatosPage antes de que BulkUpload tome el control.
  // Si BulkUpload maneja su propio spinner durante la carga, este pageLoading podría no ser necesario o usarse de forma diferente.
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');

  const showTemporaryMessage = (setter, message, duration = 5000) => {
    setter(message);
    setTimeout(() => setter(''), duration);
  };

  // Esta función será llamada por BulkUpload cuando la operación de carga (POST) se complete.
  const handleUploadResult = (result) => {
    setPageLoading(false); // Desactiva el loading de la página si estaba activo

    if (result && result.success) {
      showTemporaryMessage(
        setPageSuccess,
        result.message || 'Datos cargados exitosamente.'
      );
      // Puedes usar result.details si el backend devuelve información útil, como un resumen de la carga.
      console.log('Carga exitosa, detalles:', result.details);
    } else {
      // Muestra el mensaje de error proporcionado por BulkUpload o uno genérico.
      showTemporaryMessage(
        setPageError,
        result.message || 'Ocurrió un error al cargar los datos.'
      );
      console.error(
        'Error durante la carga:',
        result.errorDetails || result.message
      );
    }
  };

  return (
    <Layout>
      <style>{keyframes}</style>
      <Container fluid>
        <Row>
          <Col>
            <div>
              <p className="display-5 page-title-custom mb-2">
                {/* Clase de UsuariosPage */}
                <i className="bi bi-cloud-upload-fill me-3"></i>
                {/* Ícono cambiado */}
                Carga Masiva de Datos {/* Título cambiado */}
              </p>
            </div>
            <hr />
            {pageError && (
              <Alert
                variant="danger"
                style={alertStyle}
                onClose={() => setPageError('')}
                dismissible
              >
                {pageError}
              </Alert>
            )}
            {pageSuccess && (
              <Alert
                variant="success"
                style={alertStyle}
                onClose={() => setPageSuccess('')}
                dismissible
              >
                {pageSuccess}
              </Alert>
            )}

            <p className="mb-3">
              Utiliza el siguiente formulario para cargar datos desde un archivo
              Excel (.xlsx o .xls).
            </p>

            {/*
              Asegúrate de que en BulkUpload.jsx, la prop que llama después de la carga
              (aquí renombrada a onUploadComplete para claridad) envíe un objeto como:
              { success: boolean, message: string, details?: any, errorDetails?: any }
            */}
            <BulkUpload
              onUploadComplete={handleUploadResult}
              // Opcional: si quieres que CargaDatosPage sepa cuándo BulkUpload empieza a procesar/subir
              // onProcessingStart={() => {
              //   setPageLoading(true);
              //   setPageError('');
              //   setPageSuccess('');
              // }}
            />

            {pageLoading && (
              <p className="mt-3">Procesando y cargando datos...</p>
            )}
          </Col>
        </Row>
      </Container>
    </Layout>
  );
}

export default CargaDatosPage;
