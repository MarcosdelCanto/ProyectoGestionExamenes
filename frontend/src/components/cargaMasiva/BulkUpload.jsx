import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Card, Button, Form, Alert, Spinner, Table } from 'react-bootstrap';
import Select from 'react-select';
import cargaService from '../../services/cargaService';
import { fetchAllSedes } from '../../services/sedeService';

const VALID_FILE_EXTENSIONS = ['.xlsx', '.xls'];
const MAX_PREVIEW_ROWS = 5;

// Definimos TODOS los encabezados esperados para la plantilla de descarga.
// 'Plan Estudio' es crucial para el nombre inicial de la carrera.
const ALL_EXPECTED_HEADERS = [
  'Escuela',
  'Jornada',
  'CodJornada',
  'Cod.Gene.', // Puede estar presente en la planilla original, pero no se usa para el nombre de carrera
  'Nom. Asignatura',
  'Seccion',
  'Rut Docente',
  'Instruct.(den.)',
  'Mail Duoc',
  'Nombre Seccion',
  'Cant. ins.',
  'Tipo de Procesamiento',
  'Plataforma de Procesamiento',
  'Situación Evaluativa',
  'ID evento',
  'Plan Estudio', // Crucial para el nombre de la carrera inicial y sus planes
];

// Definimos solo los encabezados OBLIGATORIOS para la validación en el frontend.
const MANDATORY_HEADERS_FOR_VALIDATION = [
  'Escuela',
  'Jornada',
  // 'Cod.Gene.', // Ya no es obligatorio para el nombre de la carrera
  'Nom. Asignatura',
  'Seccion',
  'Rut Docente',
  'Nombre Seccion',
  'Plan Estudio', // Ahora es obligatorio, ya que de aquí se saca el nombre de la carrera
];

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
        const sedesData = await fetchAllSedes();
        setSedes(sedesData || []);
      } catch (err) {
        console.error('Error al cargar sedes en BulkUpload:', err);
        setError(
          'No se pudieron cargar las sedes. Por favor, recargue la página.'
        );
        setSedes([]);
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

  const clearSelection = () => {
    setSelectedFile(null);
    setFileName('');
    setJsonData(null);
    setDataForUpload(null);
    setError('');
    setSuccessMessage('');
    const fileInput = document.getElementById('bulk-upload-file-input');
    if (fileInput) fileInput.value = '';
  };

  const processFile = useCallback(() => {
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo primero.');
      return;
    }
    if (!selectedSede) {
      setError('Por favor, selecciona una sede antes de procesar.');
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
        const missingMandatoryHeaders = MANDATORY_HEADERS_FOR_VALIDATION.filter(
          (mh) => !headers.includes(mh)
        );
        if (missingMandatoryHeaders.length > 0) {
          setError(
            `El archivo Excel no contiene todas las columnas OBLIGATORIAS. Faltan: ${missingMandatoryHeaders.join(', ')}`
          );
          setIsLoading(false);
          return;
        }
        // --- FIN VALIDACIÓN DE ENCABEZADOS OBLIGATORIOS ---

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
          // Asegurarse de mapear solo los encabezados presentes en el archivo
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
  }, [selectedFile, selectedSede]);

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
      const response = await cargaService.subirDatosCargaMasiva(
        dataForUpload,
        selectedSede
      );
      const successMsg =
        response.message || 'Datos cargados exitosamente al servidor.';
      setSuccessMessage(successMsg);
      if (typeof onUploadComplete === 'function') {
        onUploadComplete({
          success: true,
          message: successMsg,
          details: response.summary,
          errors: response.specificErrors,
        });
      }
      clearSelection();
    } catch (err) {
      const errorMessage =
        err.error ||
        err.details ||
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

  const handleDownloadSample = () => {
    // La plantilla de descarga usa TODOS los encabezados esperados.
    const sampleData = [
      ALL_EXPECTED_HEADERS,
      [
        // Ejemplo de fila de datos
        'Administración y Negocios',
        'Diurno',
        'DI',
        'ADM_CA',
        'Contabilidad Básica',
        'ADM_CA_CB_D1',
        '11111111-1',
        'Juan Pérez',
        'juan.perez@profesor.duoc.cl',
        'Contabilidad Básica D1',
        '30',
        'Escrito',
        'LMS',
        'Certamen',
        '1001',
        '2020', // Plan Estudio como el nombre inicial
      ],
      [
        // Otro ejemplo con multiples planes
        'Ingeniería, Medio Ambiente y Recursos Naturales',
        'Vespertino',
        'VE',
        'ING_GA',
        'Gestión Ambiental',
        'ING_GA_GA_V1',
        '22222222-2',
        'María López',
        'maria.lopez@profesor.duoc.cl',
        'Gestión Ambiental V1',
        '35',
        'Online',
        'Plataforma PROSE',
        'Examen Final',
        '1019',
        '1111211,1116316,1116415,1111212', // Ejemplo de planes concatenados
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Carga Masiva');
    XLSX.writeFile(wb, 'plantilla_carga_masiva.xlsx');
  };

  return (
    <Card className="my-4">
      <Card.Header as="h5">Carga Masiva de Datos por Sede</Card.Header>
      <Card.Body>
        <Form>
          <div className="form-row-2col">
            <Form.Group className="mb-3">
              <Form.Label>
                1. Selecciona una Sede <span className="text-danger">*</span>
              </Form.Label>
              <Select
                inputId="bulk-sede-select"
                placeholder="-- Elige una sede --"
                isDisabled={!!fileName || isLoading || isUploading}
                options={
                  Array.isArray(sedes)
                    ? sedes.map((s) => ({
                        value: s.ID_SEDE,
                        label: s.NOMBRE_SEDE,
                      }))
                    : []
                }
                value={
                  selectedSede
                    ? {
                        value: selectedSede,
                        label:
                          sedes.find(
                            (s) => String(s.ID_SEDE) === String(selectedSede)
                          )?.NOMBRE_SEDE || selectedSede,
                      }
                    : null
                }
                onChange={(opt) => setSelectedSede(opt ? opt.value : '')}
                isClearable
                menuPortalTarget={document.body}
                menuPosition="fixed"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderColor: state.isFocused ? '#6c757d' : '#ced4da',
                    boxShadow: state.isFocused
                      ? '0 0 0 0.2rem rgba(108,117,125,0.25)'
                      : 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    opacity: !!fileName || isLoading || isUploading ? 0.65 : 1,
                    '&:hover': { borderColor: '#6c757d' },
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? '#1a1a1a'
                      : state.isFocused
                        ? '#f0f0f0'
                        : '#ffffff',
                    color: state.isSelected ? '#ffffff' : '#2d2d2d',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    ':active': { backgroundColor: '#d6d8db', color: '#1a1a1a' },
                  }),
                  singleValue: (base) => ({ ...base, color: '#2d2d2d' }),
                  placeholder: (base) => ({ ...base, color: '#6c757d' }),
                  indicatorSeparator: () => ({ display: 'none' }),
                  dropdownIndicator: (base) => ({ ...base, color: '#6c757d' }),
                  clearIndicator: (base) => ({
                    ...base,
                    color: '#6c757d',
                    '&:hover': { color: '#1a1a1a' },
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: '0.375rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
              {sedes.length === 0 && !isLoading && (
                <Form.Text className="text-muted">
                  No hay sedes cargadas.
                </Form.Text>
              )}
            </Form.Group>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>
              2. Selecciona un archivo (.xlsx, .xls)
              <span className="text-danger">*</span>
            </Form.Label>
            <label
              htmlFor="bulk-upload-file-input"
              className={`file-drop-zone${isLoading || isUploading || !selectedSede ? ' file-drop-zone--disabled' : ''}${fileName ? ' file-drop-zone--active' : ''}`}
            >
              <i className="bi bi-cloud-upload fs-3 mb-1"></i>
              <span>{fileName || 'Haz clic para seleccionar un archivo'}</span>
              <small className="text-muted">.xlsx, .xls</small>
              <Form.Control
                id="bulk-upload-file-input"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                disabled={isLoading || isUploading || !selectedSede}
                style={{ display: 'none' }}
              />
            </label>
          </Form.Group>

          {fileName && (
            <p className="mb-2">
              Archivo seleccionado: <strong>{fileName}</strong>
            </p>
          )}

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
                className="btn-confirmar-carga"
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

            <Button
              className="btn-toolbar-excel"
              onClick={handleDownloadSample}
              disabled={isLoading || isUploading}
              title="Descargar plantilla con encabezados requeridos"
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
      </Card.Body>
    </Card>
  );
}
export default BulkUpload;
