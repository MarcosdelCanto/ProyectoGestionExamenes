import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Card, Button, Form, Alert, Spinner, Table } from 'react-bootstrap';
import cargaService from '../../services/cargaService'; // Ajusta la ruta si es necesario
import { fetchAllSedes } from '../../services/sedeService'; // Asumiendo que tienes este servicio

const VALID_FILE_EXTENSIONS = ['.xlsx', '.xls'];
const MAX_PREVIEW_ROWS = 5;

// onUploadComplete es la prop que notificará a CargaDatosPage el resultado final
function BulkUpload({ onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [jsonData, setJsonData] = useState(null); // Para la vista previa (array de arrays)
  const [dataForUpload, setDataForUpload] = useState(null); // Para la subida (array de objetos)

  const [sedes, setSedes] = useState([]); // Inicializado como array vacío
  const [selectedSede, setSelectedSede] = useState(''); // ID de la sede seleccionada

  const [isLoading, setIsLoading] = useState(false); // Para procesar el archivo Excel localmente
  const [isUploading, setIsUploading] = useState(false); // Para la subida al backend
  const [error, setError] = useState(''); // Errores específicos de este componente
  const [successMessage, setSuccessMessage] = useState(''); // Mensajes de éxito específicos aquí

  useEffect(() => {
    const loadSedes = async () => {
      try {
        const sedesData = await fetchAllSedes(); // fetchAllSedes debe devolver un array o [] en error
        setSedes(sedesData || []); // Asegura que sedes sea un array
      } catch (err) {
        console.error('Error al cargar sedes en BulkUpload:', err);
        setError(
          'No se pudieron cargar las sedes. Por favor, recargue la página.'
        );
        setSedes([]); // Importante para evitar errores de .map
        // Opcional: notificar al padre si la carga de sedes es crítica
        // if (typeof onUploadComplete === 'function') {
        //   onUploadComplete({ success: false, message: 'Error crítico: No se pudieron cargar las sedes.' });
        // }
      }
    };
    loadSedes();
  }, []); // Se carga solo una vez al montar

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
        event.target.value = null; // Limpiar el input de archivo
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
    const fileInput = document.getElementById('bulk-upload-file-input'); // Asegúrate que este ID sea único si tienes varios input file
    if (fileInput) fileInput.value = '';
    // setSelectedSede(''); // Decidir si se resetea la sede es opcional
  };

  const processFile = useCallback(() => {
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo primero.');
      return;
    }
    if (!selectedSede) {
      setError('Por favor, selecciona una sede antes de procesar.');
      return;
    } // Validar sede aquí también

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
        // header: 1 para array de arrays, defval para celdas vacías
        const parsedData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        });

        if (!parsedData || parsedData.length < 2) {
          // Necesita cabeceras + al menos 1 fila de datos
          setError('El archivo está vacío o no contiene cabeceras y datos.');
          setIsLoading(false);
          return;
        }
        const headers = parsedData[0].map((header) =>
          String(header || '').trim()
        ); // Asegurar que las cabeceras sean string
        const rows = parsedData
          .slice(1)
          .filter((row) => row.some((cell) => cell !== '')); // Ignorar filas completamente vacías

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
        setJsonData(parsedData); // Para la vista previa
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
  }, [selectedFile, selectedSede]); // selectedSede añadido como dependencia

  const handleConfirmUpload = async () => {
    if (!selectedSede) {
      const noSedeMsg = 'Por favor, selecciona una sede.';
      setError(noSedeMsg);
      if (typeof onUploadComplete === 'function')
        onUploadComplete({ success: false, message: noSedeMsg });
      return;
    }
    if (!dataForUpload || dataForUpload.length === 0) {
      const noDataMsg =
        'No hay datos procesados para cargar. Por favor, procesa un archivo primero.';
      setError(noDataMsg);
      if (typeof onUploadComplete === 'function')
        onUploadComplete({ success: false, message: noDataMsg });
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccessMessage('');
    try {
      // Asumimos que el servicio 'subirDatosCargaMasiva' es el correcto.
      // Si tienes diferentes servicios para diferentes tipos de carga, necesitarías lógica aquí
      // para llamar al servicio correcto basado en 'tipoCarga' (si lo tuvieras).
      // Por ahora, usamos el genérico que toma 'sedeId'.
      const response = await cargaService.subirDatosCargaMasivaGeneralPorSede(
        dataForUpload,
        selectedSede
      );
      const successMsg =
        response.message || 'Datos cargados exitosamente al servidor.';
      setSuccessMessage(successMsg); // Mensaje de éxito interno del componente
      if (typeof onUploadComplete === 'function') {
        onUploadComplete({
          success: true,
          message: successMsg,
          details: response.details || response,
        });
      }
      clearSelection();
    } catch (err) {
      const errorMessage =
        err.details ||
        err.error ||
        err.message ||
        'Ocurrió un error al cargar los datos al servidor.';
      setError(errorMessage);
      if (typeof onUploadComplete === 'function') {
        onUploadComplete({
          success: false,
          message: errorMessage,
          errorDetails: err,
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="my-4">
      <Card.Header as="h5">Carga Masiva de Datos por Sede</Card.Header>
      <Card.Body>
        <Form>
          {/* ... (Form.Group para seleccionar Sede y Archivo) ... */}
          <Form.Group className="mb-3">
            <Form.Label>
              1. Selecciona una Sede <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={selectedSede}
              onChange={(e) => setSelectedSede(e.target.value)}
              disabled={!!fileName || isLoading || isUploading}
              aria-label="Selector de Sede"
            >
              <option value="">-- Elige una sede --</option>
              {Array.isArray(sedes) &&
                sedes.map((sede) => (
                  <option key={sede.ID_SEDE} value={sede.ID_SEDE}>
                    {sede.NOMBRE_SEDE}
                  </option>
                ))}
            </Form.Select>
            {sedes.length === 0 && !isLoading && (
              <Form.Text className="text-muted">
                No hay sedes cargadas.
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group controlId="bulk-upload-file-input" className="mb-3">
            <Form.Label>
              2. Selecciona un archivo (.xlsx, .xls){' '}
              <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              disabled={isLoading || isUploading || !selectedSede}
            />
          </Form.Group>

          {fileName && (
            <p className="mb-2">
              Archivo seleccionado: <strong>{fileName}</strong>
            </p>
          )}

          {/* --- SECCIÓN DE BOTONES CORREGIDA --- */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            <Button
              onClick={processFile}
              disabled={
                !selectedFile || isLoading || isUploading || !selectedSede
              }
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
                  <span className="ms-1">Procesando...</span>{' '}
                  {/* Texto dentro de un span */}
                </>
              ) : (
                'Ver Vista Previa'
              )}
            </Button>

            {jsonData && dataForUpload && (
              <Button
                onClick={handleConfirmUpload}
                disabled={isUploading || isLoading || !selectedSede}
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
                    <span className="ms-1">Cargando...</span>{' '}
                    {/* Texto dentro de un span */}
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
                Limpiar Selección
              </Button>
            )}
          </div>
          {/* --- FIN DE SECCIÓN DE BOTONES CORREGIDA --- */}
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
              {jsonData.length - 1 > MAX_PREVIEW_ROWS && ( // jsonData[0] es la cabecera
                <p className="text-muted small">
                  ... y {jsonData.length - 1 - MAX_PREVIEW_ROWS} filas de datos
                  más.
                </p>
              )}
            </div>
          )}
        </Form>
      </Card.Body>
    </Card>
  );
}

export default BulkUpload;
