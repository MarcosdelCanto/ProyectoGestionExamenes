import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Modal, Button, Form, Alert, Table, Spinner } from 'react-bootstrap';
import cargaDocenteService from '../../services/cargaDocenteService';
import cargaAlumnoService from '../../services/cargaAlumnoService';
import { fetchAllRoles } from '../../services/rolService';

const VALID_FILE_EXTENSIONS = ['.xlsx', '.xls'];
const MAX_PREVIEW_ROWS = 5;
const ROL_DOCENTE_ID = '2';
const ROL_ALUMNO_ID = '3';
const SALA_OPTION = 'sala'; // New option for rooms

export default function UserBulkUploadModal({
  onSuccess: onUploadProcessSuccess, // Esta es para refrescar la lista
  externalDisabled,
  onUploadResult, // Esta es para pasar los datos del resumen
}) {
  const [show, setShow] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [jsonData, setJsonData] = useState(null);
  const [dataForUpload, setDataForUpload] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllRoles()
      .then((r) => {
        if (r && r.length > 0) {
          // CORREGIDO
          setRoles(r); // CORREGIDO
        } else {
          // Considera si setError aquí es lo mejor o si el padre debe manejarlo
          console.error(
            'No se encontraron roles para cargar. La respuesta fue:',
            r
          ); // Mejor log para depurar
          setRoles([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching roles:', err);
        // Considera si setError aquí es lo mejor
        setRoles([]);
        // Podrías querer mostrar un error al usuario aquí también si la carga de roles falla
        // setError('No se pudieron cargar los roles necesarios para la carga masiva.');
      });
  }, []);

  // Los useEffects para limpiar summary y success ya no son necesarios aquí

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setError('');
    // setSuccess(''); // No necesario
    setJsonData(null);
    setDataForUpload(null);
    if (f && VALID_FILE_EXTENSIONS.includes(f.name.slice(-5))) {
      setFile(f);
      setFileName(f.name);
    } else {
      setError('Extensión de archivo no válida.');
      setFile(null);
      setFileName('');
    }
  };

  const clearAllModalState = () => {
    // Renombrado para claridad
    setSelectedRole('');
    setFile(null);
    setFileName('');
    setJsonData(null);
    setDataForUpload(null);
    setError(''); // Limpiar error del modal
  };

  const processFile = useCallback(() => {
    if (!file) {
      setError('Selecciona un archivo primero.');
      return;
    }
    setIsLoading(true);
    setError('');
    // setSuccess(''); // No necesario
    setJsonData(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target.result), {
          type: 'array',
        });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const arr = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (arr.length < 2) {
          setError('El archivo debe tener al menos una fila de datos.');
        } else {
          const [headers, ...rows] = arr;
          const formatted = rows.map((r) => {
            const obj = {};
            headers.forEach((h, i) => {
              obj[h] = r[i];
            });
            return obj;
          });
          setDataForUpload(formatted);
          setJsonData(arr);
          // Podrías tener un mensaje de éxito local para la vista previa si quieres
          // setError(''); // Asegurar que no haya error
        }
      } catch {
        setError('Error al procesar el Excel.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [file]);

  const handleUpload = async () => {
    if (!selectedOption) {
      setError('Selecciona una opción.');
      return;
    }
    if (!dataForUpload) {
      setError('Procesa un archivo primero.');
      return;
    }
    setIsUploading(true);
    setError('');

    try {
      let responseData;
      if (selectedOption === ROL_ALUMNO_ID) {
        responseData = await cargaAlumnoService.subirAlumnos(dataForUpload);
      } else if (selectedOption === ROL_DOCENTE_ID) {
        responseData = await cargaDocenteService.subirUsuariosPorRol(
          dataForUpload,
          selectedOption
        );
      } else {
        setError(
          `La opción ${selectedOption} no tiene un método de carga masiva definido.`
        );
        setIsUploading(false);
        return;
      }

      console.log(
        'UserBulkUploadModal: responseData from backend:',
        responseData
      );
      onUploadResult?.({ type: 'summary', data: responseData });

      setShow(false);
      clearAllModalState();
      onUploadProcessSuccess?.();
    } catch (e) {
      const errorMessage =
        e.response?.data?.error ||
        e.response?.data?.message ||
        e.message ||
        'Error al cargar datos.';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* El botón que abre el modal permanece aquí */}
      <Button
        variant="primary"
        onClick={() => {
          setShow(true);
          // Limpiar estados del modal al abrir, excepto el rol seleccionado si se quiere persistir
          // clearAllModalState(); // Opcional: limpiar todo al abrir
          setError(''); // Siempre limpiar error al abrir
        }}
        disabled={externalDisabled}
        className="btn-icon-only-candidate"
        title="Carga Masiva de Usuarios"
      >
        <i className="bi bi-cloud-upload"></i>
        <span className="btn-responsive-text ms-2">Carga Masiva</span>
      </Button>

      <Modal
        show={show}
        onHide={() => {
          setShow(false);
        }}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Carga Masiva</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>1. Selecciona Tipo de Carga</Form.Label>
            <Form.Select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              disabled={isLoading || isUploading || !!file}
            >
              <option value="">-- Elige una opción --</option>
              {roles.map(
                (r) =>
                  (String(r.ID_ROL) === ROL_DOCENTE_ID ||
                    String(r.ID_ROL) === ROL_ALUMNO_ID) && (
                    <option key={r.ID_ROL} value={r.ID_ROL}>
                      {r.NOMBRE_ROL}
                    </option>
                  )
              )}
            </Form.Select>
          </Form.Group>
          <Form.Group controlId="file-input" className="mb-3">
            <Form.Label>2. Selecciona un archivo (.xlsx)</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isLoading || isUploading}
            />
          </Form.Group>
          {fileName && (
            <p>
              Archivo: <strong>{fileName}</strong>
            </p>
          )}
          <div className="d-flex gap-2 mb-3">
            <Button
              onClick={processFile}
              disabled={!file || isLoading || isUploading}
            >
              {isLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                'Ver Vista Previa'
              )}
            </Button>
            {dataForUpload && (
              <Button
                variant="success"
                onClick={handleUpload}
                disabled={isUploading || !selectedOption}
              >
                {isUploading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  'Confirmar y Cargar'
                )}
              </Button>
            )}
            {(file || selectedOption) && (
              <Button
                variant="outline-secondary"
                onClick={() => {
                  clearAllModalState(); // Limpia el formulario
                  setJsonData(null); // Limpia la vista previa
                }}
                disabled={isLoading || isUploading}
              >
                Limpiar
              </Button>
            )}
          </div>
          {error && <Alert variant="danger">{error}</Alert>}
          {/* Error se muestra DENTRO del modal */}
          {jsonData && (
            <>
              <h6>Vista Previa (primeras {MAX_PREVIEW_ROWS} filas)</h6>
              <Table striped bordered size="sm" responsive>
                <thead>
                  <tr>
                    {jsonData[0].map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
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
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
