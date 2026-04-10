import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import {
  fetchAllAyudas,
  createAyuda,
  updateAyuda,
  deleteAyuda,
} from '../services/ayudaService';

// ─── Editor de secciones ──────────────────────────────────────────────────────
function SeccionesEditor({ secciones, onChange }) {
  const addSeccion = () =>
    onChange([...secciones, { subtitulo: '', icono: '', items: [] }]);

  const removeSeccion = (si) => onChange(secciones.filter((_, i) => i !== si));

  const updateSeccion = (si, field, value) =>
    onChange(
      secciones.map((s, i) => (i === si ? { ...s, [field]: value } : s))
    );

  const addItem = (si) =>
    onChange(
      secciones.map((s, i) =>
        i === si
          ? { ...s, items: [...(s.items || []), { campo: '', desc: '' }] }
          : s
      )
    );

  const removeItem = (si, ii) =>
    onChange(
      secciones.map((s, i) =>
        i === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s
      )
    );

  const updateItem = (si, ii, field, value) =>
    onChange(
      secciones.map((s, i) =>
        i === si
          ? {
              ...s,
              items: s.items.map((item, j) =>
                j === ii ? { ...item, [field]: value } : item
              ),
            }
          : s
      )
    );

  return (
    <div className="vstack gap-3">
      {secciones.map((sec, si) => (
        <div key={si} className="border rounded p-3 position-relative">
          <Button
            size="sm"
            variant="outline-danger"
            className="position-absolute top-0 end-0 m-1 py-0 px-1"
            onClick={() => removeSeccion(si)}
            title="Eliminar sección"
          >
            <i className="bi bi-x-lg" />
          </Button>
          <Row className="g-2 mb-2">
            <Col sm={7}>
              <Form.Control
                size="sm"
                placeholder="Subtítulo de la sección"
                value={sec.subtitulo}
                onChange={(e) => updateSeccion(si, 'subtitulo', e.target.value)}
              />
            </Col>
            <Col sm={5}>
              <Form.Control
                size="sm"
                placeholder="Ícono Bootstrap (ej: bi-gear-fill)"
                value={sec.icono || ''}
                onChange={(e) => updateSeccion(si, 'icono', e.target.value)}
              />
            </Col>
          </Row>

          <table className="table table-sm table-bordered mb-2">
            <thead className="table-light">
              <tr>
                <th style={{ width: '35%' }}>Campo / Elemento</th>
                <th>Descripción</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {(sec.items || []).map((item, ii) => (
                <tr key={ii}>
                  <td>
                    <Form.Control
                      size="sm"
                      placeholder="Nombre del campo"
                      value={item.campo}
                      onChange={(e) =>
                        updateItem(si, ii, 'campo', e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <Form.Control
                      size="sm"
                      placeholder="Descripción"
                      value={item.desc}
                      onChange={(e) =>
                        updateItem(si, ii, 'desc', e.target.value)
                      }
                    />
                  </td>
                  <td className="text-center">
                    <Button
                      size="sm"
                      variant="outline-danger"
                      className="py-0 px-1"
                      onClick={() => removeItem(si, ii)}
                    >
                      <i className="bi bi-trash" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => addItem(si)}
          >
            <i className="bi bi-plus-lg me-1" />
            Agregar fila
          </Button>
        </div>
      ))}
      <Button variant="outline-primary" size="sm" onClick={addSeccion}>
        <i className="bi bi-plus-circle me-1" />
        Agregar sección
      </Button>
    </div>
  );
}

// ─── Estado inicial del formulario ───────────────────────────────────────────
const FORM_EMPTY = {
  clave: '',
  titulo: '',
  descripcion: '',
  nota: '',
  ruta: '',
  activo: true,
  secciones: [],
};

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AyudaConfigPage() {
  const [ayudas, setAyudas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(FORM_EMPTY);

  const [deleteModal, setDeleteModal] = useState({ open: false, ayuda: null });

  // ── Paginación y búsqueda ────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const ayudasFiltradas = ayudas.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.CLAVE?.toLowerCase().includes(q) ||
      a.TITULO?.toLowerCase().includes(q) ||
      a.RUTA?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(ayudasFiltradas.length / pageSize));
  const inicio = (page - 1) * pageSize;
  const ayudasPagina = ayudasFiltradas.slice(inicio, inicio + pageSize);

  // Resetea página al buscar
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const showMsg = (setter, msg, ms = 5000) => {
    setter(msg);
    setTimeout(() => setter(''), ms);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAllAyudas();
      setAyudas(data || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al cargar ayudas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setForm(FORM_EMPTY);
    setModal({ open: true, editing: null });
  };

  const openEdit = (ayuda) => {
    setForm({
      clave: ayuda.CLAVE,
      titulo: ayuda.TITULO,
      descripcion: ayuda.DESCRIPCION || '',
      nota: ayuda.NOTA || '',
      ruta: ayuda.RUTA || '',
      activo: ayuda.ACTIVO === 1,
      secciones: ayuda.CONTENIDO_JSON || [],
    });
    setModal({ open: true, editing: ayuda });
  };

  const closeModal = () => {
    setModal({ open: false, editing: null });
    setForm(FORM_EMPTY);
  };

  const handleSave = async () => {
    if (!form.clave.trim() || !form.titulo.trim()) {
      setError('La clave y el título son obligatorios.');
      return;
    }
    setIsProcessing(true);
    setError('');
    try {
      const payload = {
        clave: form.clave.trim(),
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        contenido_json: form.secciones,
        nota: form.nota.trim() || null,
        ruta: form.ruta.trim() || null,
        activo: form.activo,
      };
      if (modal.editing) {
        await updateAyuda(modal.editing.ID_AYUDA, payload);
        showMsg(setSuccess, `Ayuda "${payload.titulo}" actualizada.`);
      } else {
        await createAyuda(payload);
        showMsg(setSuccess, `Ayuda "${payload.titulo}" creada.`);
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al guardar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    setError('');
    try {
      await deleteAyuda(deleteModal.ayuda.ID_AYUDA);
      showMsg(setSuccess, `Ayuda "${deleteModal.ayuda.TITULO}" eliminada.`);
      setDeleteModal({ open: false, ayuda: null });
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al eliminar.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="container-fluid pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="display-6">
            <i className="bi bi-question-circle-fill text-warning me-2" />
            Configuración de Ayuda
          </h2>
          <Button variant="primary" onClick={openNew}>
            <i className="bi bi-plus-lg me-1" />
            Nueva Ayuda
          </Button>
        </div>
        <hr />

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

        <p className="text-muted small mb-3">
          Administra los textos de ayuda que aparecen en los íconos{' '}
          <i className="bi bi-question-circle-fill text-warning" /> del sistema.
          La <strong>clave</strong> debe coincidir con el <code>helpKey</code>{' '}
          usado en el componente correspondiente.
        </p>
        {/* ── Barra de búsqueda ─────────────────────────────────────────── */}
        <div className="d-flex justify-content-between align-items-center mb-3 gap-3 flex-wrap">
          <Form.Control
            style={{ maxWidth: 320 }}
            placeholder="Buscar por clave, título o ruta..."
            value={search}
            onChange={handleSearch}
          />
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Filas por página</span>
            <div className="d-flex gap-1">
              {[5, 10, 20, 50].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={pageSize === n ? 'warning' : 'outline-secondary'}
                  onClick={() => {
                    setPageSize(n);
                    setPage(1);
                  }}
                  style={{ minWidth: 36 }}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: '#FFB81C' }} />
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Clave</th>
                  <th>Título</th>
                  <th>Ruta de página</th>
                  <th>Secciones</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ayudasPagina.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      {search
                        ? 'No se encontraron resultados.'
                        : 'No hay ayudas configuradas.'}{' '}
                      {!search && (
                        <Button
                          variant="link"
                          className="p-0"
                          onClick={openNew}
                        >
                          Crear la primera
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  ayudasPagina.map((a) => (
                    <tr key={a.ID_AYUDA}>
                      <td>{a.ID_AYUDA}</td>
                      <td>
                        <code className="bg-light px-1 rounded">{a.CLAVE}</code>
                      </td>
                      <td>{a.TITULO}</td>
                      <td>
                        {a.RUTA ? (
                          <code className="bg-light px-1 rounded small">
                            {a.RUTA}
                          </code>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                      <td>
                        <Badge bg="secondary">
                          {(a.CONTENIDO_JSON || []).length} sección(es)
                        </Badge>
                      </td>
                      <td>
                        {a.ACTIVO === 1 ? (
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
                          onClick={() => openEdit(a)}
                        >
                          <i className="bi bi-pencil" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() =>
                            setDeleteModal({ open: true, ayuda: a })
                          }
                        >
                          <i className="bi bi-trash-fill" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}

        {/* ── Controles de paginación ───────────────────────────────────── */}
        {!loading && ayudasFiltradas.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
            <span className="small text-muted">
              Mostrando {inicio + 1}–
              {Math.min(inicio + pageSize, ayudasFiltradas.length)} de{' '}
              {ayudasFiltradas.length} registro(s)
            </span>
            <div className="d-flex gap-2">
              <Button
                size="sm"
                variant="outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <i className="bi bi-chevron-left" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
                )
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="align-self-center px-1 small text-muted"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      size="sm"
                      variant={p === page ? 'warning' : 'outline-secondary'}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  )
                )}
              <Button
                size="sm"
                variant="outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <i className="bi bi-chevron-right" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal crear/editar ──────────────────────────────────────────────── */}
      <Modal
        show={modal.open}
        onHide={closeModal}
        size="xl"
        backdrop="static"
        centered
      >
        <Modal.Header closeButton className="bg-warning bg-opacity-10">
          <Modal.Title>
            <i className="bi bi-question-circle-fill text-warning me-2" />
            {modal.editing ? 'Editar Ayuda' : 'Nueva Ayuda'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3 mb-3">
            <Col md={4}>
              <Form.Label className="fw-semibold small">
                Clave <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                placeholder="ej: carga_masiva_usuarios"
                value={form.clave}
                disabled={!!modal.editing}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    clave: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                  }))
                }
              />
              <Form.Text className="text-muted">
                Solo minúsculas y guiones bajos. No se puede cambiar después.
              </Form.Text>
            </Col>
            <Col md={5}>
              <Form.Label className="fw-semibold small">
                Título <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                placeholder="Título visible en el modal de ayuda"
                value={form.titulo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titulo: e.target.value }))
                }
              />
            </Col>
            <Col md={3}>
              <Form.Label className="fw-semibold small">Estado</Form.Label>
              <Form.Check
                type="switch"
                label={form.activo ? 'Activo' : 'Inactivo'}
                checked={form.activo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, activo: e.target.checked }))
                }
                className="mt-1"
              />
            </Col>
            <Col md={8}>
              <Form.Label className="fw-semibold small">Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Descripción breve que aparece debajo del título"
                value={form.descripcion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descripcion: e.target.value }))
                }
              />
            </Col>
            <Col md={4}>
              <Form.Label className="fw-semibold small">
                Nota de advertencia
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Nota que aparece al final en amarillo"
                value={form.nota}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nota: e.target.value }))
                }
              />
            </Col>
            <Col md={12}>
              <Form.Label className="fw-semibold small">
                Ruta de página{' '}
                <span className="text-muted fw-normal">
                  (para mostrar automáticamente en páginas)
                </span>
              </Form.Label>
              <Form.Control
                placeholder="ej: /gestion/reservas  o  /mis-reservas"
                value={form.ruta}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ruta: e.target.value }))
                }
              />
              <Form.Text className="text-muted">
                Si indicas una ruta, el botón de ayuda aparecerá automáticamente
                en esa página sin tocar código. Deja en blanco si solo usas la
                ayuda con <code>helpKey</code> en un componente específico.
              </Form.Text>
            </Col>
          </Row>

          <Form.Label className="fw-semibold small">
            Secciones de contenido
          </Form.Label>
          <SeccionesEditor
            secciones={form.secciones}
            onChange={(secciones) => setForm((f) => ({ ...f, secciones }))}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={closeModal}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" /> Guardando…
              </>
            ) : (
              <>
                <i className="bi bi-floppy me-1" />
                Guardar
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal eliminar ──────────────────────────────────────────────────── */}
      <Modal
        show={deleteModal.open}
        onHide={() => setDeleteModal({ open: false, ayuda: null })}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Eliminar Ayuda</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Confirmas la eliminación de la ayuda{' '}
          <strong>{deleteModal.ayuda?.TITULO}</strong>?
          <Alert variant="warning" className="mt-2 mb-0 py-2 small">
            <i className="bi bi-exclamation-triangle-fill me-1" />
            Los íconos de ayuda que usen la clave{' '}
            <code>{deleteModal.ayuda?.CLAVE}</code> mostrarán el contenido del
            archivo local como fallback.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeleteModal({ open: false, ayuda: null })}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isProcessing}
          >
            {isProcessing ? <Spinner size="sm" /> : 'Eliminar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
}
