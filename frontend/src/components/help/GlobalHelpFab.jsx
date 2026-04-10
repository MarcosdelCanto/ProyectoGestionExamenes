import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { fetchAyudaByRuta } from '../../services/ayudaService';

/**
 * GlobalHelpFab — Botón flotante de ayuda controlado 100% desde el mantenedor.
 *
 * Se agrega UNA SOLA VEZ en Layout. No requiere tocarlo nunca más.
 * El admin configura la "Ruta de página" en Configuración > Ayuda y el botón
 * aparece (o desaparece) automáticamente en esa ruta.
 */
export default function GlobalHelpFab() {
  const { pathname } = useLocation();
  const [config, setConfig] = useState(null);
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);

  // Cuando cambia la ruta, consulta si hay ayuda activa para ella
  useEffect(() => {
    let cancelled = false;
    setVisible(false);
    setConfig(null);
    setShow(false);

    fetchAyudaByRuta(pathname)
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
        // No hay ayuda para esta ruta — no mostrar nada
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!visible || !config) return null;

  return (
    <>
      {/* Botón flotante anclado abajo a la derecha */}
      <Button
        onClick={() => setShow(true)}
        title="Ver ayuda de esta página"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 1040,
          borderRadius: '50%',
          width: 48,
          height: 48,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        }}
        variant="warning"
      >
        <i className="bi bi-question-lg fs-5 text-white" />
      </Button>

      {/* Modal de ayuda */}
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
    </>
  );
}
