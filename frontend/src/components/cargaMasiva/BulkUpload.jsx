import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Card, Button, Form, Alert, Spinner, Table } from 'react-bootstrap';
import cargaService from '../../services/cargaService'; // Ajusta la ruta si es necesario
import { fetchAllSedes } from '../../services/sedeService'; // Asumiendo que tienes este servicio

const VALID_FILE_EXTENSIONS = ['.xlsx', '.xls'];
const MAX_PREVIEW_ROWS = 5;

// Se añade la prop onUploadComplete
function BulkUpload({ onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [jsonData, setJsonData] = useState(null);
  const [dataForUpload, setDataForUpload] = useState(null);
  const [sedes, setSedes] = useState([]);
  const [selectedSede, setSelectedSede] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadSedes = async () => {
      try {
        const response = await fetchAllSedes();
        setSedes(response.data); // Asumiendo que response.data es el array de sedes
      } catch (err) {
        // Considera llamar a onUploadComplete también para errores de carga de sedes si es crítico
        setError('No se pudieron cargar las sedes.');
      }
    };
    loadSedes();
  }, []);

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
        const fileInput = document.getElementById('bulk-upload-file-input');
        if (fileInput) fileInput.value = ''; // Limpiar el input
        return;
      }
      setSelectedFile(file);
      setFileName(file.name);
    } else {
      setSelectedFile(null);
      setFileName('');
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setFileName('');
    setJsonData(null);
    setDataForUpload(null);
    setError('');
    setSuccessMessage('');
    // setSelectedSede(''); // Opcional: decidir si limpiar la sede también
    const fileInput = document.getElementById('bulk-upload-file-input');
    if (fileInput) fileInput.value = '';
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
          header: 1, // Obtiene un array de arrays
          defval: '', // Celdas vacías como string vacío
        });

        if (parsedData.length < 2) {
          setError(
            'El archivo debe contener cabeceras y al menos una fila de datos.'
          );
          setIsLoading(false);
          return;
        }
        const headers = parsedData[0];
        const rows = parsedData.slice(1);
        const formattedData = rows.map((row) => {
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[String(header).trim()] = row[index]; // Asegura que las cabeceras sean strings y sin espacios extra
          });
          return rowData;
        });
        setDataForUpload(formattedData);
        setJsonData(parsedData); // Para la vista previa, mantenemos el formato array de arrays
        setSuccessMessage(
          `Vista previa generada. Se encontraron ${rows.length} filas de datos.`
        );
      } catch (err) {
        console.error('Error al procesar Excel:', err);
        setError('Error al procesar el archivo Excel. Verifica el formato.');
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
    if (!selectedSede) {
      setError('Por favor, selecciona una sede.');
      // Notificar a la página padre si es necesario
      onUploadComplete?.({
        success: false,
        message: 'Por favor, selecciona una sede.',
      });
      return;
    }
    if (!dataForUpload || dataForUpload.length === 0) {
      setError('No hay datos para cargar. Procesa un archivo primero.');
      onUploadComplete?.({
        success: false,
        message: 'No hay datos para cargar. Procesa un archivo primero.',
      });
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccessMessage('');
    try {
      // Aquí se asume que subirDatosCargaMasiva es para la carga general que usa sedeId
      const response = await cargaService.subirDatosCargaMasiva(
        dataForUpload,
        selectedSede
      );
      const successMsg = response.message || 'Datos cargados exitosamente.'; // Asumiendo que el backend devuelve response.message
      setSuccessMessage(successMsg);
      onUploadComplete?.({
        success: true,
        message: successMsg,
        details: response,
      });
      clearSelection(); // Limpiar después de una carga exitosa
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        'Ocurrió un error al cargar los datos.';
      setError(errorMessage);
      onUploadComplete?.({
        success: false,
        message: errorMessage,
        errorDetails: err,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="my-4">
      <Card.Header>Carga Masiva de Datos (General por Sede)</Card.Header>
      <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label>1. Selecciona una Sede</Form.Label>
          <Form.Select
            value={selectedSede}
            onChange={(e) => setSelectedSede(e.target.value)}
            disabled={!!fileName || isLoading || isUploading} // Deshabilitar si hay archivo o procesando
          >
            <option value="">-- Elige una sede --</option>
            {sedes.map((sede) => (
              <option key={sede.ID_SEDE} value={sede.ID_SEDE}>
                {sede.NOMBRE_SEDE}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group controlId="bulk-upload-file-input" className="mb-3">
          <Form.Label>2. Selecciona un archivo (.xlsx, .xls)</Form.Label>
          <Form.Control
            type="file"
            accept=".xlsx, .xls"
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
                {' Procesando...'}
              </>
            ) : (
              'Ver Vista Previa'
            )}
          </Button>
          {jsonData && (
            <Button
              onClick={handleConfirmUpload}
              disabled={isUploading || isLoading || !selectedSede} // Deshabilitar si no hay sede
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
                  {' Cargando...'}
                </>
              ) : (
                'Confirmar y Cargar a BD'
              )}
            </Button>
          )}
          {selectedFile && (
            <Button
              variant="outline-secondary"
              onClick={clearSelection}
              disabled={isLoading || isUploading}
            >
              Limpiar
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        {successMessage &&
          !error && ( // Solo mostrar mensaje de éxito si no hay error
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
            <h5>Vista Previa de Datos (primeras {MAX_PREVIEW_ROWS} filas):</h5>
            <Table striped bordered hover responsive size="sm">
              {jsonData[0] && (
                <thead>
                  <tr>
                    {jsonData[0].map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {jsonData.slice(1, MAX_PREVIEW_ROWS + 1).map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => (
                      <td key={ci}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
            {jsonData.length > MAX_PREVIEW_ROWS + 1 && (
              <p className="text-muted small">
                ... y {jsonData.length - (MAX_PREVIEW_ROWS + 1)} filas más.
              </p>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default BulkUpload;
