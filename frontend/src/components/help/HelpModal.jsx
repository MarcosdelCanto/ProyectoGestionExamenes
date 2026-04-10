import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import helpConfig from '../../config/helpConfig';
import { fetchAyudaByClave } from '../../services/ayudaService';

/**
 * HelpModal — Modal de ayuda reutilizable.
 *
 * Props:
 *   helpKey       {string}  — clave en AYUDA_SISTEMA / helpConfig.js
 *   showLabel     {boolean} — muestra texto "Ayuda" junto al ícono (default: false)
 *   size          {string}  — tamaño del botón trigger: 'sm' | 'md' (default: 'sm')
 *   variant       {string}  — variante Bootstrap del botón trigger (default: 'outline-secondary')
 *   className     {string}  — clase extra para el botón trigger
 *   useFallback   {boolean} — si true, muestra el ícono aunque la clave esté inactiva/ausente en BD,
 *                             usando helpConfig.js como fallback (default: false)
 */
export default function HelpModal({
  helpKey,
  showLabel = false,
  size = 'sm',
  variant = 'outline-secondary',
  className = '',
  useFallback = false,
}) {
  const [show, setShow] = useState(false);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  // null = verificando, true = mostrar botón, false = ocultar botón
  const [visible, setVisible] = useState(null);

  // Verifica al montar si la clave existe y está activa en BD
  useEffect(() => {
    let cancelled = false;
    fetchAyudaByClave(helpKey)
      .then((data) => {
        if (cancelled) return;
        // Existe y está activa → precarga el config y muestra el botón
        setConfig({
          titulo: data.TITULO,
          descripcion: data.DESCRIPCION,
          secciones: data.CONTENIDO_JSON || [],
          nota: data.NOTA,
        });
        setVisible(true);
      })
      .catch(() => {
        if (cancelled) return;
        // No existe o está inactiva en BD
        if (useFallback && helpConfig[helpKey]) {
          // Solo muestra si se permite fallback y existe en config local
          setConfig(helpConfig[helpKey]);
          setVisible(true);
        } else {
          setVisible(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [helpKey, useFallback]);

  const handleClose = () => {
    setShow(false);
  };

  const handleOpen = () => {
    // Si por alguna razón el config no está cargado aún, carga ahora
    if (!config) {
      setLoading(true);
      fetchAyudaByClave(helpKey)
        .then((data) => {
          setConfig({
            titulo: data.TITULO,
            descripcion: data.DESCRIPCION,
            secciones: data.CONTENIDO_JSON || [],
            nota: data.NOTA,
          });
        })
        .catch(() => {
          if (useFallback && helpConfig[helpKey])
            setConfig(helpConfig[helpKey]);
        })
        .finally(() => setLoading(false));
    }
    setShow(true);
  };

  // Mientras verifica (null) o si está inactiva (false), no renderiza nada
  if (!visible) return null;

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={`border-0 ${className}`}
        style={{ lineHeight: 1 }}
        title="Ver ayuda"
        onClick={handleOpen}
      >
        <i className="bi bi-question-circle-fill text-warning" />
        {showLabel && <span className="ms-1">Ayuda</span>}
      </Button>

      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Header
          closeButton
          className="bg-warning bg-opacity-10 border-warning border-opacity-25"
        >
          <Modal.Title className="d-flex align-items-center gap-2">
            <i className="bi bi-question-circle-fill text-warning" />
            {config?.titulo || 'Ayuda'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" style={{ color: '#FFB81C' }} />
            </div>
          ) : !config ? (
            <p className="text-muted">
              No hay información de ayuda disponible para esta sección.
            </p>
          ) : (
            <>
              {config.descripcion && (
                <p className="text-muted mb-3">{config.descripcion}</p>
              )}

              {(config.secciones || []).map((seccion, si) => (
                <div key={si} className="mb-4">
                  <h6 className="fw-bold mb-2">
                    {seccion.icono && (
                      <i
                        className={`bi ${seccion.icono} me-2 text-secondary`}
                      />
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
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
