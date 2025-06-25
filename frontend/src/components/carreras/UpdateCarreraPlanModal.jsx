import React, { useState, useCallback, useRef } from 'react';
import { Modal, Button, Form, Alert, Spinner, Table } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import carreraService from '../../services/carreraService';

const VALID_FILE_EXTENSIONS = ['.xlsx', '.xls'];
const MAX_PREVIEW_ROWS = 5;

// Encabezados OBLIGATORIOS para este tipo de carga (actualización de carrera y planes)
const MANDATORY_HEADERS_UPDATE_CARRERA = [
  'Nombre Carrera', // El nombre real de la carrera (el que está en la DB)
  'Plan Estudio', // Los planes de estudio numéricos asociados (ej. "2020" o "2020 2021")
];

// Todos los encabezados esperados para la plantilla de descarga de esta carga
const ALL_EXPECTED_HEADERS_UPDATE_CARRERA = ['Nombre Carrera', 'Plan Estudio'];

function UpdateCarreraPlanModal({ show, handleClose, onUpdateComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [jsonData, setJsonData] = useState(null);
  const [dataForUpload, setDataForUpload] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  const clearSelection = () => {
    setSelectedFile(null);
    setFileName('');
    setJsonData(null);
    setDataForUpload(null);
    setError('');
    setSuccessMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = () => {
    clearSelection();
    handleClose();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setError('');
    setSuccessMessage('');
    setJsonData(null);
    setDataForUpload(null);
    if (file) {
      const fileExtension = `.${file.name.split('.').pop()}`;
      if (!VALID_FILE_EXTENSIONS.includes(fileExtension.toLowerCase())) {
        setError(
          'Extensión de archivo no válida. Solo se permiten .xlsx o .xls.'
        );
        setSelectedFile(null);
        setFileName('');
        event.target.value = null;
        return;
      }
      setSelectedFile(file);
      setFileName(file.name);
    } else {
      setSelectedFile(null);
      setFileName('');
    }
  };

  const processFile = useCallback(() => {
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo primero.');
      return;
    }

    setIsLoading(true);
    setError('');
    setJsonData(null);
    setDataForUpload(null);
    setSuccessMessage('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const parsedData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        });

        if (!parsedData || parsedData.length < 2) {
          setError('El archivo está vacío o no contiene cabeceras y datos.');
          setIsLoading(false);
          return;
        }
        const headers = parsedData[0].map((header) =>
          String(header || '').trim()
        );

        // --- VALIDACIÓN DE ENCABEZADOS OBLIGATORIOS ---
        const missingMandatoryHeaders = MANDATORY_HEADERS_UPDATE_CARRERA.filter(
          (mh) => !headers.includes(mh)
        );
        if (missingMandatoryHeaders.length > 0) {
          setError(
            `El archivo Excel no contiene todas las columnas OBLIGATORIAS. Faltan: ${missingMandatoryHeaders.join(', ')}`
          );
          setIsLoading(false);
          return;
        }
        // --- FIN VALIDACIÓN ---

        const rows = parsedData
          .slice(1)
          .filter((row) => row.some((cell) => cell !== ''));

        if (rows.length === 0) {
          setError(
            'El archivo no contiene filas de datos después de las cabeceras.'
          );
          setIsLoading(false);
          return;
        }

        const formattedData = rows.map((row) => {
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index];
          });
          return rowData;
        });
        setDataForUpload(formattedData);
        setJsonData(parsedData);
        setSuccessMessage(
          `Vista previa generada. ${rows.length} filas de datos encontradas (sin contar cabeceras).`
        );
      } catch (err) {
        console.error('Error al procesar Excel:', err);
        setError(
          'Error al procesar el archivo Excel. Verifica el formato y contenido.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('No se pudo leer el archivo.');
      setIsLoading(false);
    };
    reader.readAsArrayBuffer(selectedFile);
  }, [selectedFile]);

  const handleConfirmUpload = async () => {
    if (!dataForUpload || dataForUpload.length === 0) {
      const noDataMsg =
        'No hay datos procesados para cargar. Por favor, procesa un archivo primero.';
      setError(noDataMsg);
      if (typeof onUpdateComplete === 'function')
        onUpdateComplete({ success: false, message: noDataMsg });
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response =
        await carreraService.updateCarrerasByPlanEstudio(dataForUpload);
      const successMsg =
        response.message || 'Carreras actualizadas exitosamente.';
      setSuccessMessage(successMsg);
      if (typeof onUpdateComplete === 'function') {
        onUpdateComplete({
          success: true,
          message: successMsg,
          details: response.summary,
          errors: response.specificErrors,
        });
      }
      handleModalClose();
    } catch (err) {
      const errorMessage =
        err.error ||
        err.details ||
        err.message ||
        'Ocurrió un error al actualizar las carreras.';
      setError(errorMessage);
      if (typeof onUpdateComplete === 'function') {
        onUpdateComplete({
          success: false,
          message: errorMessage,
          errorDetails: err,
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSample = () => {
    const sampleData = [
      ALL_EXPECTED_HEADERS_UPDATE_CARRERA,
      [
        // Ejemplo 1: El nombre real de la carrera en la BD
        'Programa de Formación Cristiana',
        '1111211,1116316,1116415,1111212', // Los planes de estudio numéricos asociados a esa carrera
      ],
      [
        // Ejemplo 2: Otro caso
        'Ingeniería en Informática',
        '2020 2021',
      ],
      [
        // Ejemplo 3: Plan de estudio único
        'Contabilidad y Auditoría',
        '2019',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Actualizar Carreras');
    XLSX.writeFile(wb, 'plantilla_actualizar_carreras.xlsx');
  };

  return (
    <Modal
      show={show}
      onHide={handleModalClose}
      size="lg"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton className="mb-0">
        <Modal.Title>Actualizar Planes de Estudio de Carreras</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert
          variant="info"
          style={{ fontSize: '0.85em' }}
          className="mt-0 mb-3"
        >
          Este módulo permite asociar y actualizar Planes de Estudio de
          Carreras.
          <br />
          La columna "Nombre Carrera" debe **coincidir exactamente** con el
          nombre actual en el sistema.
          <br />
          La columna "Plan Estudio" debe contener uno o más códigos (ej. "2020"
          o "2020 2021"), separados por espacios o comas.
          <br />
          **Validación:** La actualización procede si el nombre de la carrera en
          la BD *contiene al menos uno* de los planes indicados en esta
          planilla, confirmando la carrera correcta.
        </Alert>
        <Form>
          <Form.Group controlId="update-carrera-file-input" className="mb-3">
            <Form.Label>
              1. Selecciona un archivo (.xlsx, .xls)
              <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx, .xls"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isLoading || isUploading}
            />
          </Form.Group>

          {fileName && (
            <p className="mb-2">
              Archivo seleccionado: <strong>{fileName}</strong>
            </p>
          )}

          <div className="d-flex flex-wrap gap-2 mb-3">
            <Button
              onClick={processFile}
              disabled={!selectedFile || isLoading || isUploading}
              variant="primary"
            >
              {isLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span className="ms-1">Procesando...</span>
                </>
              ) : (
                'Ver Vista Previa'
              )}
            </Button>

            {jsonData && dataForUpload && (
              <Button
                onClick={handleConfirmUpload}
                disabled={isUploading || isLoading}
                variant="success"
              >
                {isUploading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    <span className="ms-1">Cargando...</span>
                  </>
                ) : (
                  'Confirmar y Actualizar BD'
                )}
              </Button>
            )}

            {selectedFile && (
              <Button
                variant="outline-secondary"
                onClick={clearSelection}
                disabled={isLoading || isUploading}
              >
                Limpiar Selección
              </Button>
            )}

            <Button
              variant="info"
              onClick={handleDownloadSample}
              disabled={isLoading || isUploading}
              title="Descargar plantilla para actualización de carreras"
            >
              <i className="bi bi-download me-2"></i> Descargar Plantilla
            </Button>
          </div>
          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}
          {successMessage && !error && (
            <Alert
              variant="success"
              onClose={() => setSuccessMessage('')}
              dismissible
            >
              {successMessage}
            </Alert>
          )}

          {jsonData && jsonData.length > 0 && (
            <div>
              <h5>
                Vista Previa de Datos (primeras {MAX_PREVIEW_ROWS} filas de
                datos):
              </h5>
              <Table
                striped
                bordered
                hover
                responsive
                size="sm"
                className="mt-2"
              >
                {jsonData[0] && (
                  <thead>
                    <tr>
                      {jsonData[0].map((h, i) => (
                        <th key={`header-${i}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {jsonData.slice(1, MAX_PREVIEW_ROWS + 1).map((r, ri) => (
                    <tr key={`row-${ri}`}>
                      {r.map((c, ci) => (
                        <td key={`cell-${ri}-${ci}`}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
              {jsonData.length - 1 > MAX_PREVIEW_ROWS && (
                <p className="text-muted small">
                  ... y {jsonData.length - 1 - MAX_PREVIEW_ROWS} filas de datos
                  más.
                </p>
              )}
            </div>
          )}
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default UpdateCarreraPlanModal;
