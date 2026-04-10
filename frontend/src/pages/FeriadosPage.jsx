import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { Alert, Spinner, Badge, Form, Button, Row, Col, Nav } from 'react-bootstrap';
import {
  fetchAllFeriados,
  createFeriado,
  updateFeriado,
  deleteFeriado,
} from '../services/feriadoService';
import { fetchAllModulos } from '../services/moduloService';
import {
  fetchAllPeriodos,
  createPeriodo,
  updatePeriodo,
  deletePeriodo,
} from '../services/periodoReservasService';

// ─── Modal helper ──────────────────────────────────────────────────────────
function Modal({ title, children, onClose, size = '' }) {
  return (
    <div
      className="modal show"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className={`modal-dialog modal-dialog-centered ${size}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            />
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Formulario de feriado ─────────────────────────────────────────────────
function FeriadoForm({ initial, modulos, onSave, onCancel, isProcessing }) {
  const [form, setForm] = useState({
    fecha_feriado: initial?.FECHA_FERIADO || '',
    nombre_feriado: initial?.NOMBRE_FERIADO || '',
    descripcion_feriado: initial?.DESCRIPCION_FERIADO || '',
    tipo_bloqueo: initial?.TIPO_BLOQUEO || 'COMPLETO',
    activo: initial?.ACTIVO ?? 1,
    modulos_ids: initial?.MODULOS?.map((m) => m.MODULO_ID_MODULO) || [],
  });

  const toggle = (f) => setForm((p) => ({ ...p, [f]: p[f] === 1 ? 0 : 1 }));

  const toggleModulo = (id) => {
    setForm((p) => ({
      ...p,
      modulos_ids: p.modulos_ids.includes(id)
        ? p.modulos_ids.filter((x) => x !== id)
        : [...p.modulos_ids, id],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Form.Group as={Col} md={6}>
          <Form.Label>Fecha</Form.Label>
          <Form.Control
            type="date"
            value={form.fecha_feriado}
            onChange={(e) =>
              setForm((p) => ({ ...p, fecha_feriado: e.target.value }))
            }
            required
          />
        </Form.Group>
        <Form.Group as={Col} md={6}>
          <Form.Label>Activo</Form.Label>
          <div className="mt-2">
            <Form.Check
              type="switch"
              id="activo-switch"
              label={form.activo === 1 ? 'Sí' : 'No'}
              checked={form.activo === 1}
              onChange={() => toggle('activo')}
            />
          </div>
        </Form.Group>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Nombre</Form.Label>
        <Form.Control
          type="text"
          value={form.nombre_feriado}
          onChange={(e) =>
            setForm((p) => ({ ...p, nombre_feriado: e.target.value }))
          }
          maxLength={200}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Descripción (opcional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={form.descripcion_feriado}
          onChange={(e) =>
            setForm((p) => ({ ...p, descripcion_feriado: e.target.value }))
          }
          maxLength={500}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Tipo de bloqueo</Form.Label>
        <div>
          <Form.Check
            inline
            type="radio"
            id="tipo-completo"
            label="Día completo"
            value="COMPLETO"
            checked={form.tipo_bloqueo === 'COMPLETO'}
            onChange={() =>
              setForm((p) => ({
                ...p,
                tipo_bloqueo: 'COMPLETO',
                modulos_ids: [],
              }))
            }
          />
          <Form.Check
            inline
            type="radio"
            id="tipo-modulos"
            label="Módulos específicos"
            value="MODULOS"
            checked={form.tipo_bloqueo === 'MODULOS'}
            onChange={() => setForm((p) => ({ ...p, tipo_bloqueo: 'MODULOS' }))}
          />
        </div>
      </Form.Group>

      {form.tipo_bloqueo === 'MODULOS' && (
        <Form.Group className="mb-3">
          <Form.Label>Módulos bloqueados</Form.Label>
          <div
            className="p-2 border rounded"
            style={{ maxHeight: '200px', overflowY: 'auto' }}
          >
            {modulos.map((m) => (
              <Form.Check
                key={m.ID_MODULO}
                type="checkbox"
                id={`mod-${m.ID_MODULO}`}
                label={`${m.NOMBRE_MODULO} (${m.INICIO_MODULO} – ${m.FIN_MODULO})`}
                checked={form.modulos_ids.includes(m.ID_MODULO)}
                onChange={() => toggleModulo(m.ID_MODULO)}
              />
            ))}
          </div>
        </Form.Group>
      )}

      <div className="modal-footer px-0 pb-0">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isProcessing}
          className="me-2"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          style={{
            backgroundColor: '#FFB81C',
            borderColor: '#FFB81C',
            color: '#1a1a1a',
          }}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Spinner size="sm" /> Guardando…
            </>
          ) : (
            'Guardar'
          )}
        </Button>
      </div>
    </Form>
  );
}

// ─── Formulario de período ─────────────────────────────────────────────────
function PeriodoForm({ initial, onSave, onCancel, isProcessing }) {
  const [form, setForm] = useState({
    nombre_periodo:  initial?.NOMBRE_PERIODO  || '',
    descripcion:     initial?.DESCRIPCION     || '',
    fecha_inicio:    initial?.FECHA_INICIO    || '',
    fecha_fin:       initial?.FECHA_FIN       || '',
    activo:          initial?.ACTIVO ?? 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Nombre del período</Form.Label>
        <Form.Control
          type="text"
          value={form.nombre_periodo}
          onChange={(e) => setForm((p) => ({ ...p, nombre_periodo: e.target.value }))}
          maxLength={200}
          required
        />
      </Form.Group>

      <Row className="mb-3">
        <Form.Group as={Col} md={6}>
          <Form.Label>Fecha inicio</Form.Label>
          <Form.Control
            type="date"
            value={form.fecha_inicio}
            onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
            required
          />
        </Form.Group>
        <Form.Group as={Col} md={6}>
          <Form.Label>Fecha fin</Form.Label>
          <Form.Control
            type="date"
            value={form.fecha_fin}
            min={form.fecha_inicio || undefined}
            onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))}
            required
          />
        </Form.Group>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Descripción (opcional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={form.descripcion}
          onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
          maxLength={500}
        />
      </Form.Group>

      <Row className="mb-3">
        <Col>
          <Form.Check
            type="switch"
            id="periodo-activo-switch"
            label={form.activo === 1 ? 'Activo' : 'Inactivo'}
            checked={form.activo === 1}
            onChange={() =>
              setForm((p) => ({ ...p, activo: p.activo === 1 ? 0 : 1 }))
            }
          />
        </Col>
      </Row>

      <div className="modal-footer px-0 pb-0">
        <Button variant="secondary" onClick={onCancel} disabled={isProcessing} className="me-2">
          Cancelar
        </Button>
        <Button type="submit" className="btn-primary" disabled={isProcessing}>
          {isProcessing ? <><Spinner size="sm" /> Guardando…</> : 'Guardar'}
        </Button>
      </div>
    </Form>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function FeriadosPage() {
  const [activeTab, setActiveTab] = useState('feriados');

  // ── feriados ──
  const [feriados, setFeriados] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState({ type: null, entity: null });
  const [filterTexto, setFilterTexto] = useState('');

  // ── periodos ──
  const [periodos, setPeriodos] = useState([]);
  const [periodoModal, setPeriodoModal] = useState({ type: null, entity: null });

  const showMsg = (setter, msg, ms = 5000) => {
    setter(msg);
    setTimeout(() => setter(''), ms);
  };

  const loadPeriodos = useCallback(async () => {
    try {
      const data = await fetchAllPeriodos();
      setPeriodos(data || []);
    } catch {
      /* silent — error visible via loadData */
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [feriadosData, modulosData, periodosData] = await Promise.all([
        fetchAllFeriados(),
        fetchAllModulos(),
        fetchAllPeriodos(),
      ]);
      setFeriados(feriadosData || []);
      setModulos(modulosData || []);
      setPeriodos(periodosData || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (formData) => {
    setIsProcessing(true);
    setError('');
    try {
      if (modal.entity) {
        await updateFeriado(modal.entity.ID_FERIADO, formData);
        showMsg(setSuccess, 'Feriado actualizado correctamente.');
      } else {
        await createFeriado(formData);
        showMsg(setSuccess, 'Feriado creado correctamente.');
      }
      setModal({ type: null, entity: null });
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al guardar el feriado.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    setError('');
    try {
      await deleteFeriado(modal.entity.ID_FERIADO);
      showMsg(setSuccess, 'Feriado eliminado correctamente.');
      setModal({ type: null, entity: null });
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al eliminar el feriado.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePeriodo = async (formData) => {
    setIsProcessing(true);
    setError('');
    try {
      if (periodoModal.entity) {
        await updatePeriodo(periodoModal.entity.ID_PERIODO, formData);
        showMsg(setSuccess, 'Período actualizado correctamente.');
      } else {
        await createPeriodo(formData);
        showMsg(setSuccess, 'Período creado correctamente.');
      }
      setPeriodoModal({ type: null, entity: null });
      await loadPeriodos();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al guardar el período.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePeriodo = async () => {
    setIsProcessing(true);
    setError('');
    try {
      await deletePeriodo(periodoModal.entity.ID_PERIODO);
      showMsg(setSuccess, 'Período eliminado correctamente.');
      setPeriodoModal({ type: null, entity: null });
      await loadPeriodos();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al eliminar el período.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = feriados.filter(
    (f) =>
      f.NOMBRE_FERIADO.toLowerCase().includes(filterTexto.toLowerCase()) ||
      f.FECHA_FERIADO.includes(filterTexto)
  );

  return (
    <Layout>
      <div className="container-fluid pt-4">
        {/* Encabezado */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="display-6">
            <i className="bi bi-calendar-x-fill me-3" />
            Feriados y Bloqueos
          </h2>
        </div>

        <hr />

        {/* Mensajes */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="feriados">
              <i className="bi bi-calendar-x me-2" />
              Feriados
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="periodos">
              <i className="bi bi-calendar-range me-2" />
              Períodos habilitados
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* ══ Tab Feriados ══ */}
        {activeTab === 'feriados' && (
          <>
            {/* Filtro + Botón */}
            <Row className="mb-3 align-items-center">
              <Col md={4}>
                <Form.Control
                  placeholder="Buscar por nombre o fecha…"
                  value={filterTexto}
                  onChange={(e) => setFilterTexto(e.target.value)}
                />
              </Col>
              <Col xs="auto">
                <Button
                  className="btn-primary"
                  onClick={() => setModal({ type: 'form', entity: null })}
                >
                  <i className="bi bi-plus-lg me-1" />
                  Nuevo feriado
                </Button>
              </Col>
            </Row>

            {/* Tabla feriados */}
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" style={{ color: '#FFB81C' }} />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Tipo</th>
                      <th>Módulos</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          No hay feriados registrados.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((f) => (
                        <tr key={f.ID_FERIADO}>
                          <td>
                            <strong>{f.FECHA_FERIADO}</strong>
                          </td>
                          <td>{f.NOMBRE_FERIADO}</td>
                          <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                            {f.DESCRIPCION_FERIADO || '—'}
                          </td>
                          <td>
                            {f.TIPO_BLOQUEO === 'COMPLETO' ? (
                              <Badge bg="danger">Día completo</Badge>
                            ) : (
                              <Badge bg="warning" text="dark">Módulos</Badge>
                            )}
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>
                            {f.TIPO_BLOQUEO === 'COMPLETO' ? (
                              <span className="text-muted">Todos</span>
                            ) : f.MODULOS.length > 0 ? (
                              f.MODULOS.map((m) => (
                                <span key={m.MODULO_ID_MODULO} className="badge bg-secondary me-1">
                                  {m.NOMBRE_MODULO}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            {f.ACTIVO === 1 ? (
                              <Badge bg="success">Activo</Badge>
                            ) : (
                              <Badge bg="secondary">Inactivo</Badge>
                            )}
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              className="me-1"
                              title="Editar"
                              onClick={() => setModal({ type: 'form', entity: f })}
                            >
                              <i className="bi bi-pencil" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              title="Eliminar"
                              onClick={() => setModal({ type: 'delete', entity: f })}
                            >
                              <i className="bi bi-trash" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ══ Tab Períodos habilitados ══ */}
        {activeTab === 'periodos' && (
          <>
            <Row className="mb-3 align-items-center">
              <Col>
                <p className="text-muted mb-0">
                  Define los rangos de fechas en que los usuarios pueden agendar exámenes.
                  Si no hay períodos activos, no se aplica restricción de fechas.
                </p>
              </Col>
              <Col xs="auto">
                <Button
                  className="btn-primary"
                  onClick={() => setPeriodoModal({ type: 'form', entity: null })}
                >
                  <i className="bi bi-plus-lg me-1" />
                  Nuevo período
                </Button>
              </Col>
            </Row>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" style={{ color: '#FFB81C' }} />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Fecha inicio</th>
                      <th>Fecha fin</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">
                          No hay períodos registrados.
                        </td>
                      </tr>
                    ) : (
                      periodos.map((p) => (
                        <tr key={p.ID_PERIODO}>
                          <td><strong>{p.NOMBRE_PERIODO}</strong></td>
                          <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                            {p.DESCRIPCION || '—'}
                          </td>
                          <td>{p.FECHA_INICIO}</td>
                          <td>{p.FECHA_FIN}</td>
                          <td>
                            {p.ACTIVO === 1 ? (
                              <Badge bg="success">Activo</Badge>
                            ) : (
                              <Badge bg="secondary">Inactivo</Badge>
                            )}
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              className="me-1"
                              title="Editar"
                              onClick={() => setPeriodoModal({ type: 'form', entity: p })}
                            >
                              <i className="bi bi-pencil" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              title="Eliminar"
                              onClick={() => setPeriodoModal({ type: 'delete', entity: p })}
                            >
                              <i className="bi bi-trash" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Crear/Editar feriado */}
      {modal.type === 'form' && (
        <Modal
          title={modal.entity ? 'Editar feriado' : 'Nuevo feriado'}
          onClose={() => setModal({ type: null, entity: null })}
          size="modal-lg"
        >
          <FeriadoForm
            initial={modal.entity}
            modulos={modulos}
            onSave={handleSave}
            onCancel={() => setModal({ type: null, entity: null })}
            isProcessing={isProcessing}
          />
        </Modal>
      )}

      {/* Modal Eliminar feriado */}
      {modal.type === 'delete' && (
        <Modal
          title="Confirmar eliminación"
          onClose={() => setModal({ type: null, entity: null })}
        >
          <p>
            ¿Estás seguro de que deseas eliminar el feriado{' '}
            <strong>{modal.entity?.NOMBRE_FERIADO}</strong> del{' '}
            <strong>{modal.entity?.FECHA_FERIADO}</strong>?
          </p>
          <Alert variant="danger">
            <i className="bi bi-exclamation-triangle-fill me-2" />
            Esta acción es irreversible.
          </Alert>
          <div className="modal-footer px-0 pb-0">
            <Button
              variant="secondary"
              onClick={() => setModal({ type: null, entity: null })}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <><Spinner size="sm" /> Eliminando…</>
              ) : (
                'Sí, eliminar'
              )}
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal Crear/Editar período */}
      {periodoModal.type === 'form' && (
        <Modal
          title={periodoModal.entity ? 'Editar período' : 'Nuevo período habilitado'}
          onClose={() => setPeriodoModal({ type: null, entity: null })}
          size="modal-lg"
        >
          <PeriodoForm
            initial={periodoModal.entity}
            onSave={handleSavePeriodo}
            onCancel={() => setPeriodoModal({ type: null, entity: null })}
            isProcessing={isProcessing}
          />
        </Modal>
      )}

      {/* Modal Eliminar período */}
      {periodoModal.type === 'delete' && (
        <Modal
          title="Confirmar eliminación"
          onClose={() => setPeriodoModal({ type: null, entity: null })}
        >
          <p>
            ¿Estás seguro de que deseas eliminar el período{' '}
            <strong>{periodoModal.entity?.NOMBRE_PERIODO}</strong>?
          </p>
          <Alert variant="danger">
            <i className="bi bi-exclamation-triangle-fill me-2" />
            Esta acción es irreversible.
          </Alert>
          <div className="modal-footer px-0 pb-0">
            <Button
              variant="secondary"
              onClick={() => setPeriodoModal({ type: null, entity: null })}
              disabled={isProcessing}
              className="me-2"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeletePeriodo}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <><Spinner size="sm" /> Eliminando…</>
              ) : (
                'Sí, eliminar'
              )}
            </Button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
