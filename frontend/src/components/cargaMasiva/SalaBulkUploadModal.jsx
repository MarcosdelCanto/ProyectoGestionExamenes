import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Modal, Button, Form, Alert, Table, Spinner } from 'react-bootstrap';
import cargaSalaService from '../../services/cargaSalaService';

const VALID_FILE_EXTENSIONS = ['.xlsx', '.xls'];
const MAX_PREVIEW_ROWS = 5;

export default function SalaBulkUploadModal({
  onSuccess: onUploadProcessSuccess,
  externalDisabled,
  onUploadResult,
}) {
  const [show, setShow] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [jsonData, setJsonData] = useState(null);
  const [dataForUpload, setDataForUpload] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // ... copiar los métodos handleFileChange, processFile, clearAllModalState del UserBulkUploadModal
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
    setFile(null);
    setFileName('');
    setJsonData(null);
    setDataForUpload(null);
    setError('');
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
  // pero eliminar la lógica relacionada con roles y selectedOption

  const handleUpload = async () => {
    if (!dataForUpload) {
      setError('Procesa un archivo primero.');
      return;
    }
    setIsUploading(true);
    setError('');

    try {
      const responseData = await cargaSalaService.subirSalas(dataForUpload);

      console.log(
        'SalaBulkUploadModal: responseData from backend:',
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
      <Button
        variant="primary"
        onClick={() => {
          setShow(true);
          setError('');
        }}
        disabled={externalDisabled}
        className="btn-icon-only-candidate"
        title="Carga Masiva de Salas"
      >
        <i className="bi bi-cloud-upload"></i>
        <span className="btn-responsive-text ms-2">Carga Masiva de Salas</span>
      </Button>

      <Modal
        show={show}
        onHide={() => setShow(false)}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Carga Masiva de Salas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Archivo Excel</Form.Label>
              <div className="d-flex gap-2 align-items-center">
                <Form.Control
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  style={{ display: 'none' }}
                  id="fileInput"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  Seleccionar archivo
                </Button>
                <span>{fileName || 'Sin archivos seleccionados'}</span>
              </div>
            </Form.Group>

            {error && <Alert variant="danger">{error}</Alert>}
          </Form>

          {file && !jsonData && (
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button
                variant="secondary"
                onClick={() => setShow(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button variant="primary" onClick={processFile} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Procesando...
                  </>
                ) : (
                  'Previsualizar'
                )}
              </Button>
            </div>
          )}

          {jsonData && (
            <>
              <h6 className="mt-4">Vista previa:</h6>
              <div className="table-responsive">
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      {jsonData[0].map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jsonData
                      .slice(1, MAX_PREVIEW_ROWS + 1)
                      .map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <Button
                  variant="secondary"
                  onClick={() => setShow(false)}
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Cargando...
                    </>
                  ) : (
                    'Cargar'
                  )}
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
