import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { fetchAyudaByClave } from '../../services/ayudaService';

/**
 * HelpModalTitle — Reemplaza <Modal.Title> y agrega automáticamente el ícono
 * de ayuda si la clave está activa en BD. Sin clave activa, solo muestra el título.
 *
 * Uso (reemplaza Modal.Title una sola vez, luego se gestiona desde el mantenedor):
 *   <HelpModalTitle helpKey="carga_masiva_usuarios">
 *     Carga Masiva de Usuarios
 *   </HelpModalTitle>
 *
 * Props:
 *   helpKey   {string}  — clave en AYUDA_SISTEMA
 *   children  {node}    — contenido del título (texto u otros elementos)
 */
export default function HelpModalTitle({ helpKey, children }) {
  const [config, setConfig] = useState(null);
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!helpKey) return;
    let cancelled = false;
    fetchAyudaByClave(helpKey)
      .then((data) => {
        if (cancelled) return;
        setConfig({
          titulo: data.TITULO,
          descripcion: data.DESCRIPCION,
          secciones: data.CONTENIDO_JSON || [],
          nota: data.NOTA,
        });
        setVisible(true);
      })
      .catch(() => {
        // Clave inactiva o no existe → no muestra el ícono
      });
    return () => {
      cancelled = true;
    };
  }, [helpKey]);

  return (
    <>
      <Modal.Title className="d-flex align-items-center gap-2">
        {children}
        {visible && (
          <Button
            size="sm"
            variant="outline-secondary"
            className="border-0 ms-1"
            style={{ lineHeight: 1 }}
            title="Ver ayuda"
            onClick={() => setShow(true)}
          >
            <i className="bi bi-question-circle-fill text-warning" />
          </Button>
        )}
      </Modal.Title>

      {/* Modal de ayuda — se renderiza fuera del Modal.Title pero dentro del mismo árbol */}
      {visible && config && (
        <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
          <Modal.Header
            closeButton
            className="bg-warning bg-opacity-10 border-warning border-opacity-25"
          >
            <Modal.Title className="d-flex align-items-center gap-2">
              <i className="bi bi-question-circle-fill text-warning" />
              {config.titulo}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {config.descripcion && (
              <p className="text-muted mb-3">{config.descripcion}</p>
            )}

            {(config.secciones || []).map((seccion, si) => (
              <div key={si} className="mb-4">
                <h6 className="fw-bold mb-2">
                  {seccion.icono && (
                    <i className={`bi ${seccion.icono} me-2 text-secondary`} />
                  )}
                  {seccion.subtitulo}
                </h6>
                <table className="table table-sm table-bordered mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '35%' }}>Campo / Elemento</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(seccion.items || []).map((item, ii) => (
                      <tr key={ii}>
                        <td>
                          <code className="text-dark bg-light px-1 rounded">
                            {item.campo}
                          </code>
                        </td>
                        <td className="small">{item.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {config.nota && (
              <div className="alert alert-warning d-flex gap-2 mb-0 py-2">
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1" />
                <span className="small">{config.nota}</span>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShow(false)}>
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}
