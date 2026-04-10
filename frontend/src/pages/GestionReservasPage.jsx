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
} from 'react-bootstrap';
import Select from 'react-select';
import ReservaForm from '../components/reservas/ReservaForm';
import HelpModalTitle from '../components/help/HelpModalTitle';
import { usePermission } from '../hooks/usePermission';
import {
  fetchAllReservas,
  fetchReservaById,
  fetchAlumnosByReservaId,
  fetchReservasByCarrera,
  fetchReservasBySeccion,
  updateReserva,
  cancelarReservaCompleta,
  crearReservaParaExamenExistenteService,
} from '../services/reservaService';

// --- Helpers ------------------------------------------------------------------
const formatFecha = (valor) => {
  if (!valor) return '—';
  try {
    return new Date(valor).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return String(valor);
  }
};

const toISODate = (valor) => {
  if (!valor) return '';
  try {
    return new Date(valor).toISOString().slice(0, 10);
  } catch {
    return String(valor).slice(0, 10);
  }
};

const formatHora = (valor) => {
  if (!valor) return '—';
  const text = String(valor);
  const hhmm = text.match(/(\d{2}:\d{2})/);
  return hhmm ? hhmm[1] : text;
};

const estadoBadge = (estado) => {
  const map = {
    PROGRAMADO: 'primary',
    ACTIVO: 'success',
    EN_CURSO: 'warning',
    CANCELADO: 'danger',
    FINALIZADO: 'secondary',
  };
  return (
    <Badge bg={map[estado] || 'light'} text={map[estado] ? undefined : 'dark'}>
      {estado || '—'}
    </Badge>
  );
};

const confirmacionBadge = (estado) => {
  const map = {
    PENDIENTE: { bg: 'warning', text: 'dark' },
    CONFIRMADO: { bg: 'success', text: undefined },
    REQUIERE_REVISION: { bg: 'danger', text: undefined },
  };
  const style = map[estado] || { bg: 'secondary', text: undefined };
  return (
    <Badge bg={style.bg} text={style.text}>
      {estado || '—'}
    </Badge>
  );
};

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: '#6c757d',
    boxShadow: state.isFocused
      ? '0 0 0 0.25rem rgba(108, 117, 125, 0.25)'
      : 'none',
    '&:hover': { borderColor: '#6c757d' },
    minHeight: '38px',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#1a1a1a'
      : state.isFocused
        ? '#e9ecef'
        : '#fff',
    color: state.isSelected ? '#fff' : '#1a1a1a',
  }),
  menu: (base) => ({ ...base, zIndex: 20 }),
  indicatorSeparator: () => ({ display: 'none' }),
};

// --- Página principal ---------------------------------------------------------
export default function GestionReservasPage() {
  const { hasPermission } = usePermission();

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtros
  const [filterTexto, setFilterTexto] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterConfirmacion, setFilterConfirmacion] = useState('');

  // Modales
  const [newModal, setNewModal] = useState(false);
  const [editModal, setEditModal] = useState({
    open: false,
    reserva: null,
    initialData: null,
  });
  const [cancelModal, setCancelModal] = useState({
    open: false,
    reserva: null,
  });
  const [alumnosModal, setAlumnosModal] = useState({
    open: false,
    reserva: null,
    alumnos: [],
    loading: false,
    filter: '',
    page: 1,
    pageSize: 10,
  });
  const [detalleModal, setDetalleModal] = useState({
    open: false,
    reserva: null,
    loading: false,
  });

  const showMsg = (setter, msg, ms = 5000) => {
    setter(msg);
    setTimeout(() => setter(''), ms);
  };

  // Determinar qué endpoint usar según el permiso del usuario
  const loadReservas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (hasPermission('VER TODAS LAS RESERVA')) {
        data = await fetchAllReservas();
      } else if (hasPermission('GESTION RESERVA CARRERA')) {
        data = await fetchReservasByCarrera();
      } else if (hasPermission('GESTION RESERVA SECCION')) {
        data = await fetchReservasBySeccion();
      } else {
        data = [];
      }
      setReservas(data || []);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.error ||
          'Error al cargar las reservas.'
      );
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    loadReservas();
  }, [loadReservas]);

  // -- Nueva reserva ----------------------------------------------------------
  const handleCreateReserva = async (formDataPayload) => {
    setIsProcessing(true);
    setError('');
    try {
      const response =
        await crearReservaParaExamenExistenteService(formDataPayload);
      const msg = response.id_reserva
        ? `Reserva #${response.id_reserva} creada exitosamente.`
        : response.message || 'Reserva creada exitosamente.';
      showMsg(setSuccess, msg);
      setNewModal(false);
      await loadReservas();
    } catch (err) {
      setError(err?.details || err?.error || 'Error al crear la reserva.');
    } finally {
      setIsProcessing(false);
    }
  };

  // -- Abrir modal de edición -------------------------------------------------
  const handleOpenEdit = async (reserva) => {
    setIsProcessing(true);
    setError('');
    try {
      const detalle = await fetchReservaById(reserva.ID_RESERVA);

      const docentesIds = detalle.DOCENTES_IDS
        ? String(detalle.DOCENTES_IDS).split('||').filter(Boolean)
        : [];
      const docentesNames = detalle.NOMBRES_DOCENTES
        ? String(detalle.NOMBRES_DOCENTES).split('||').filter(Boolean)
        : [];
      const docentes = docentesIds.map((id, i) => ({
        value: parseInt(id),
        label: docentesNames[i] || `Docente ${id}`,
      }));

      const initialData = {
        examen: { value: detalle.ID_EXAMEN, label: detalle.NOMBRE_EXAMEN },
        sala: { value: detalle.ID_SALA, label: detalle.NOMBRE_SALA },
        docentes,
        fechaReserva: toISODate(detalle.FECHA_RESERVA),
        modulosIds: (detalle.MODULOS || []).map((m) => m.ID_MODULO),
        modulosDetalle: (detalle.MODULOS || []).map((m) => ({
          ID_MODULO: Number(m.ID_MODULO),
          NOMBRE_MODULO: m.NOMBRE_MODULO,
          INICIO_MODULO: m.INICIO_MODULO,
          FIN_MODULO: m.FIN_MODULO,
          ORDEN: Number(m.ORDEN || m.ORDEN_MODULO || 0),
        })),
      };

      setEditModal({ open: true, reserva: detalle, initialData });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          'Error al cargar el detalle de la reserva.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // -- Guardar edición --------------------------------------------------------
  const handleSaveEdit = async (formDataPayload) => {
    setIsProcessing(true);
    setError('');
    try {
      await updateReserva(editModal.reserva.ID_RESERVA, formDataPayload);
      showMsg(
        setSuccess,
        `Reserva #${editModal.reserva.ID_RESERVA} actualizada correctamente.`
      );
      setEditModal({ open: false, reserva: null, initialData: null });
      await loadReservas();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al actualizar la reserva.');
    } finally {
      setIsProcessing(false);
    }
  };

  // -- Cancelar reserva -------------------------------------------------------
  const handleCancelar = async () => {
    setIsProcessing(true);
    setError('');
    try {
      await cancelarReservaCompleta(cancelModal.reserva.ID_RESERVA);
      showMsg(
        setSuccess,
        `Reserva #${cancelModal.reserva.ID_RESERVA} cancelada. El examen volvió al estado ACTIVO.`
      );
      setCancelModal({ open: false, reserva: null });
      await loadReservas();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.error ||
          'Error al cancelar la reserva.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenAlumnosModal = async (reserva) => {
    setAlumnosModal({
      open: true,
      reserva,
      alumnos: [],
      loading: true,
      filter: '',
      page: 1,
      pageSize: 10,
    });
    try {
      const alumnos = await fetchAlumnosByReservaId(reserva.ID_RESERVA);
      setAlumnosModal((prev) => ({ ...prev, alumnos: alumnos || [] }));
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.error ||
          'Error al cargar alumnos asociados.'
      );
    } finally {
      setAlumnosModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCloseAlumnosModal = () => {
    setAlumnosModal({
      open: false,
      reserva: null,
      alumnos: [],
      loading: false,
      filter: '',
      page: 1,
      pageSize: 10,
    });
  };

  const handleOpenDetalle = async (reserva) => {
    setDetalleModal({ open: true, reserva, loading: true });
    try {
      const detalle = await fetchReservaById(reserva.ID_RESERVA);
      // Merge: keep all list-row fields (NOMBRE_SECCION, HORA_INICIO_RESERVA, etc.)
      // and add MODULOS + any extra fields from the detail endpoint
      setDetalleModal({
        open: true,
        reserva: { ...reserva, ...detalle },
        loading: false,
      });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          'Error al cargar el detalle de la reserva.'
      );
      setDetalleModal({ open: false, reserva: null, loading: false });
    }
  };

  const handleCloseDetalle = () => {
    setDetalleModal({ open: false, reserva: null, loading: false });
  };

  // -- Filtrado ---------------------------------------------------------------
  const filtered = reservas.filter((r) => {
    const txt = filterTexto.toLowerCase();
    const matchTexto =
      !txt ||
      String(r.ID_RESERVA).includes(txt) ||
      (r.NOMBRE_EXAMEN || '').toLowerCase().includes(txt) ||
      (r.NOMBRE_SALA || '').toLowerCase().includes(txt) ||
      (r.NOMBRE_DOCENTE_ASIGNADO || '').toLowerCase().includes(txt) ||
      (r.NOMBRE_ESCUELA || '').toLowerCase().includes(txt) ||
      (r.NOMBRE_CARRERA || '').toLowerCase().includes(txt);
    const matchEstado = !filterEstado || r.ESTADO_RESERVA === filterEstado;
    const matchConf =
      !filterConfirmacion ||
      r.ESTADO_CONFIRMACION_DOCENTE === filterConfirmacion;
    return matchTexto && matchEstado && matchConf;
  });

  const estadosUnicos = [
    ...new Set(reservas.map((r) => r.ESTADO_RESERVA).filter(Boolean)),
  ];
  const confirmacionesUnicas = [
    ...new Set(
      reservas.map((r) => r.ESTADO_CONFIRMACION_DOCENTE).filter(Boolean)
    ),
  ];

  const estadoOptions = [
    { value: '', label: 'Todos los estados' },
    ...estadosUnicos.map((estado) => ({ value: estado, label: estado })),
  ];
  const confirmacionOptions = [
    { value: '', label: 'Toda confirmación docente' },
    ...confirmacionesUnicas.map((estado) => ({ value: estado, label: estado })),
  ];

  const canEdit =
    hasPermission('EDITAR RESERVA') ||
    hasPermission('VER TODAS LAS RESERVA') ||
    hasPermission('GESTION RESERVA CARRERA') ||
    hasPermission('GESTION RESERVA SECCION');
  const canDelete =
    hasPermission('ELIMINAR RESERVA') ||
    hasPermission('VER TODAS LAS RESERVA') ||
    hasPermission('GESTION RESERVA CARRERA') ||
    hasPermission('GESTION RESERVA SECCION');
  const canCreate =
    hasPermission('CREAR RESERVA EXAMEN') ||
    hasPermission('VER TODAS LAS RESERVA') ||
    hasPermission('GESTION RESERVA CARRERA') ||
    hasPermission('GESTION RESERVA SECCION');

  const alumnosFiltrados = (alumnosModal.alumnos || []).filter((a) => {
    const txt = alumnosModal.filter.toLowerCase().trim();
    if (!txt) return true;
    return (
      (a.NOMBRE_USUARIO || '').toLowerCase().includes(txt) ||
      (a.EMAIL_USUARIO || '').toLowerCase().includes(txt)
    );
  });

  const totalPaginasAlumnos = Math.max(
    1,
    Math.ceil(alumnosFiltrados.length / alumnosModal.pageSize)
  );
  const paginaActualAlumnos = Math.min(alumnosModal.page, totalPaginasAlumnos);
  const inicioAlumnos = (paginaActualAlumnos - 1) * alumnosModal.pageSize;
  const alumnosPaginados = alumnosFiltrados.slice(
    inicioAlumnos,
    inicioAlumnos + alumnosModal.pageSize
  );

  return (
    <Layout>
      <div className="container-fluid pt-4">
        {/* Encabezado */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="display-6">
            <i className="bi bi-calendar2-week-fill me-2" />
            Gestión de Reservas
          </h2>
          {canCreate && (
            <Button className="btn-primary" onClick={() => setNewModal(true)}>
              <i className="bi bi-plus-lg me-1" />
              Nueva Reserva
            </Button>
          )}
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

        {/* Filtros */}
        <Row className="mb-3 g-2 align-items-end">
          <Col md={4}>
            <Form.Control
              placeholder="Buscar por ID, examen, sala, carrera, docente…"
              value={filterTexto}
              onChange={(e) => setFilterTexto(e.target.value)}
            />
          </Col>
          <Col md={2}>
            <Select
              classNamePrefix="react-select"
              options={estadoOptions}
              value={estadoOptions.find((opt) => opt.value === filterEstado)}
              onChange={(selected) => setFilterEstado(selected?.value || '')}
              styles={selectStyles}
              isSearchable={false}
            />
          </Col>
          <Col md={2}>
            <Select
              classNamePrefix="react-select"
              options={confirmacionOptions}
              value={confirmacionOptions.find(
                (opt) => opt.value === filterConfirmacion
              )}
              onChange={(selected) =>
                setFilterConfirmacion(selected?.value || '')
              }
              styles={selectStyles}
              isSearchable={false}
            />
          </Col>
          <Col xs="auto">
            <Button
              variant="outline-secondary"
              onClick={() => {
                setFilterTexto('');
                setFilterEstado('');
                setFilterConfirmacion('');
              }}
            >
              <i className="bi bi-x-lg me-1" />
              Limpiar
            </Button>
          </Col>
        </Row>

        {/* Tabla */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: '#FFB81C' }} />
          </div>
        ) : (
          <>
            <p className="text-muted small mb-2">
              {filtered.length} reserva{filtered.length !== 1 ? 's' : ''}{' '}
              encontrada{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Examen</th>
                    <th>Escuela / Carrera</th>
                    <th>Fecha</th>
                    <th>Módulos</th>
                    <th>Hora Inicio</th>
                    <th>Hora Fin</th>
                    <th>Alumnos</th>
                    <th>Sala</th>
                    <th>Docente(s)</th>
                    <th>Estado</th>
                    <th>Confirmación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center text-muted py-4">
                        No hay reservas que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r.ID_RESERVA}>
                        <td>
                          <span className="fw-semibold">#{r.ID_RESERVA}</span>
                        </td>
                        <td style={{ maxWidth: 220 }}>
                          <div className="fw-semibold">{r.NOMBRE_EXAMEN}</div>
                          <small className="text-muted">
                            {r.NOMBRE_SECCION}
                          </small>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>
                            {r.NOMBRE_ESCUELA || '—'}
                          </div>
                          <small className="text-muted">
                            {r.NOMBRE_CARRERA}
                          </small>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {formatFecha(r.FECHA_RESERVA)}
                        </td>
                        <td>
                          {r.CANTIDAD_MODULOS_RESERVA ??
                            r.CANTIDAD_MODULOS_EXAMEN ??
                            '—'}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {formatHora(r.HORA_INICIO_RESERVA)}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {formatHora(r.HORA_FIN_RESERVA)}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            className="py-0 px-2"
                            title="Ver alumnos asociados"
                            onClick={() => handleOpenAlumnosModal(r)}
                          >
                            <i className="bi bi-people-fill me-1" />
                            {r.CANTIDAD_ALUMNOS_ASOCIADOS ?? 0}
                          </Button>
                        </td>
                        <td>{r.NOMBRE_SALA || '—'}</td>
                        <td style={{ maxWidth: 180, fontSize: '0.85rem' }}>
                          {r.NOMBRES_DOCENTES
                            ? String(r.NOMBRES_DOCENTES).split('||').join(', ')
                            : r.NOMBRE_DOCENTE_ASIGNADO || (
                                <span className="text-muted">Sin asignar</span>
                              )}
                        </td>
                        <td>{estadoBadge(r.ESTADO_RESERVA)}</td>
                        <td>
                          {confirmacionBadge(r.ESTADO_CONFIRMACION_DOCENTE)}
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline-warning"
                            className="me-1"
                            title="Ver detalle de reserva"
                            style={{ color: '#fd7e14', borderColor: '#fd7e14' }}
                            onClick={() => handleOpenDetalle(r)}
                          >
                            <i className="bi bi-eye" />
                          </Button>
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              className="me-1"
                              title="Editar reserva"
                              disabled={isProcessing}
                              onClick={() => handleOpenEdit(r)}
                            >
                              {isProcessing &&
                              editModal.reserva?.ID_RESERVA === r.ID_RESERVA ? (
                                <Spinner size="sm" />
                              ) : (
                                <i className="bi bi-pencil" />
                              )}
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              title="Cancelar reserva"
                              disabled={isProcessing}
                              onClick={() =>
                                setCancelModal({ open: true, reserva: r })
                              }
                            >
                              <i className="bi bi-trash-fill" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* -- Modal nueva reserva ---------------------------------------------- */}
      <Modal
        show={newModal}
        onHide={() => !isProcessing && setNewModal(false)}
        size="xl"
        backdrop="static"
        centered
      >
        <Modal.Header closeButton>
          <HelpModalTitle helpKey="modal_nueva_reserva">
            <i className="bi bi-plus-circle me-2" />
            Nueva Reserva
          </HelpModalTitle>
        </Modal.Header>
        <Modal.Body>
          {newModal && (
            <ReservaForm
              key="new-reserva"
              isEditMode={false}
              onSubmit={handleCreateReserva}
              onCancel={() => setNewModal(false)}
              isLoadingExternally={isProcessing}
              submitButtonText="Crear Reserva"
            />
          )}
        </Modal.Body>
      </Modal>

      {/* -- Modal edición --------------------------------------------------- */}
      <Modal
        show={editModal.open}
        onHide={() =>
          !isProcessing &&
          setEditModal({ open: false, reserva: null, initialData: null })
        }
        size="xl"
        backdrop="static"
        centered
      >
        <Modal.Header closeButton>
          <HelpModalTitle helpKey="modal_editar_reserva">
            <i className="bi bi-pencil-square me-2" />
            Editar Reserva #{editModal.reserva?.ID_RESERVA}
          </HelpModalTitle>
        </Modal.Header>
        <Modal.Body>
          {editModal.open && editModal.initialData && (
            <ReservaForm
              key={editModal.reserva?.ID_RESERVA}
              initialData={editModal.initialData}
              isEditMode={true}
              onSubmit={handleSaveEdit}
              onCancel={() =>
                setEditModal({ open: false, reserva: null, initialData: null })
              }
              isLoadingExternally={isProcessing}
              submitButtonText="Guardar cambios"
            />
          )}
        </Modal.Body>
      </Modal>

      {/* -- Modal cancelar -------------------------------------------------- */}
      <Modal
        show={cancelModal.open}
        onHide={() =>
          !isProcessing && setCancelModal({ open: false, reserva: null })
        }
        centered
      >
        <Modal.Header closeButton>
          <HelpModalTitle helpKey="modal_cancelar_reserva">
            Cancelar reserva #{cancelModal.reserva?.ID_RESERVA}
          </HelpModalTitle>
        </Modal.Header>
        <Modal.Body>
          <p>
            ¿Confirmas la cancelación de la reserva del examen{' '}
            <strong>{cancelModal.reserva?.NOMBRE_EXAMEN}</strong> del{' '}
            <strong>{formatFecha(cancelModal.reserva?.FECHA_RESERVA)}</strong>?
          </p>
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle-fill me-2" />
            La reserva se eliminará y el examen volverá al estado{' '}
            <strong>ACTIVO</strong>.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setCancelModal({ open: false, reserva: null })}
            disabled={isProcessing}
          >
            Volver
          </Button>
          <Button
            variant="danger"
            onClick={handleCancelar}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" /> Cancelando…
              </>
            ) : (
              'Sí, cancelar reserva'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={alumnosModal.open}
        onHide={handleCloseAlumnosModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <HelpModalTitle helpKey="modal_alumnos_reserva">
            <i className="bi bi-people-fill me-2" />
            Alumnos Asociados - Reserva #{alumnosModal.reserva?.ID_RESERVA}
          </HelpModalTitle>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            className="mb-3"
            placeholder="Filtrar por nombre o correo..."
            value={alumnosModal.filter}
            onChange={(e) =>
              setAlumnosModal((prev) => ({
                ...prev,
                filter: e.target.value,
                page: 1,
              }))
            }
          />

          {alumnosModal.loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : alumnosFiltrados.length === 0 ? (
            <Alert variant="light" className="mb-0">
              No se encontraron alumnos asociados para esta reserva.
            </Alert>
          ) : (
            <div className="table-responsive" style={{ maxHeight: '420px' }}>
              <table className="table table-sm table-hover align-middle mb-0">
                <thead
                  className="table-light"
                  style={{ position: 'sticky', top: 0 }}
                >
                  <tr>
                    <th style={{ width: '70px' }}>#</th>
                    <th>Alumno</th>
                    <th>Correo</th>
                    <th>Sección</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosPaginados.map((alumno, index) => (
                    <tr key={alumno.ID_USUARIO}>
                      <td>{inicioAlumnos + index + 1}</td>
                      <td className="fw-semibold">{alumno.NOMBRE_USUARIO}</td>
                      <td className="text-muted">
                        {alumno.EMAIL_USUARIO || 'Sin correo'}
                      </td>
                      <td>
                        <Badge bg="secondary">
                          {alumno.NOMBRE_SECCION || '—'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!alumnosModal.loading && alumnosFiltrados.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted">Filas por página</span>
                <Form.Select
                  size="sm"
                  value={alumnosModal.pageSize}
                  style={{ width: '90px' }}
                  onChange={(e) =>
                    setAlumnosModal((prev) => ({
                      ...prev,
                      pageSize: Number(e.target.value),
                      page: 1,
                    }))
                  }
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </Form.Select>
              </div>

              <div className="small text-muted">
                Mostrando {inicioAlumnos + 1} -
                {Math.min(
                  inicioAlumnos + alumnosModal.pageSize,
                  alumnosFiltrados.length
                )}{' '}
                de {alumnosFiltrados.length}
              </div>

              <div className="d-flex gap-2">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  disabled={paginaActualAlumnos <= 1}
                  onClick={() =>
                    setAlumnosModal((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                >
                  Anterior
                </Button>
                <span className="small align-self-center">
                  Página {paginaActualAlumnos} de {totalPaginasAlumnos}
                </span>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  disabled={paginaActualAlumnos >= totalPaginasAlumnos}
                  onClick={() =>
                    setAlumnosModal((prev) => ({
                      ...prev,
                      page: Math.min(totalPaginasAlumnos, prev.page + 1),
                    }))
                  }
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
      {/* -- Modal detalle reserva --------------------------------------------- */}
      <Modal
        show={detalleModal.open}
        onHide={handleCloseDetalle}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <HelpModalTitle helpKey="modal_detalle_reserva">
            <i className="bi bi-eye-fill me-2 text-white" />
            Detalle de Reserva #{detalleModal.reserva?.ID_RESERVA}
          </HelpModalTitle>
        </Modal.Header>
        <Modal.Body>
          {detalleModal.loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: '#FFB81C' }} />
            </div>
          ) : detalleModal.reserva ? (
            (() => {
              const r = detalleModal.reserva;
              const docentes = r.DOCENTES_IDS
                ? String(r.DOCENTES_IDS)
                    .split('||')
                    .filter(Boolean)
                    .map((id, i) => {
                      const nombres = r.NOMBRES_DOCENTES
                        ? String(r.NOMBRES_DOCENTES).split('||')
                        : [];
                      return nombres[i] || `Docente ${id}`;
                    })
                : r.NOMBRE_DOCENTE_ASIGNADO
                  ? [r.NOMBRE_DOCENTE_ASIGNADO]
                  : [];
              const modulos = Array.isArray(r.MODULOS) ? r.MODULOS : [];
              const inicio =
                r.HORA_INICIO_RESERVA ||
                r.HORA_INICIO ||
                (modulos.length > 0
                  ? modulos.reduce(
                      (min, m) =>
                        m.INICIO_MODULO && (!min || m.INICIO_MODULO < min)
                          ? m.INICIO_MODULO
                          : min,
                      null
                    )
                  : null);
              const fin =
                r.HORA_FIN_RESERVA ||
                r.HORA_FIN ||
                (modulos.length > 0
                  ? modulos.reduce(
                      (max, m) =>
                        m.FIN_MODULO && (!max || m.FIN_MODULO > max)
                          ? m.FIN_MODULO
                          : max,
                      null
                    )
                  : null);
              return (
                <div className="vstack gap-2">
                  {/* Examen */}
                  <div className="border rounded p-2">
                    <div className="small fw-bold text-primary mb-1">
                      <i className="bi bi-file-earmark-text me-1" />
                      Examen
                    </div>
                    <div className="fw-semibold">{r.NOMBRE_EXAMEN || '—'}</div>
                    <div className="small text-muted mt-1">
                      Sección:{' '}
                      <span className="text-dark">
                        {r.NOMBRE_SECCION || '—'}
                      </span>
                    </div>
                    <div className="small text-muted">
                      Carrera:{' '}
                      <span className="text-dark">
                        {r.NOMBRE_CARRERA || '—'}
                      </span>
                    </div>
                    <div className="small text-muted">
                      Escuela:{' '}
                      <span className="text-dark">
                        {r.NOMBRE_ESCUELA || '—'}
                      </span>
                    </div>
                    {r.INSCRITOS_EXAMEN != null && (
                      <div className="small text-muted">
                        Inscritos:{' '}
                        <span className="text-dark">
                          <i className="bi bi-people me-1" />
                          {r.INSCRITOS_EXAMEN}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Docentes */}
                  <div className="border rounded p-2">
                    <div className="small fw-bold text-secondary mb-1">
                      <i className="bi bi-person-badge me-1" />
                      Docente(s) Asignado(s)
                    </div>
                    {docentes.length === 0 ? (
                      <span className="small text-muted fst-italic">
                        Sin asignar
                      </span>
                    ) : (
                      <ul className="mb-0 ps-3 small">
                        {docentes.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Fila inferior: datos de la reserva */}
                  <div className="border rounded p-2">
                    <div className="small fw-bold text-success mb-1">
                      <i className="bi bi-calendar2-check me-1" />
                      Reserva
                    </div>
                    <Row className="g-1">
                      <Col xs={6} sm={3}>
                        <div className="small text-muted">Fecha</div>
                        <div className="small fw-semibold">
                          {formatFecha(r.FECHA_RESERVA)}
                        </div>
                      </Col>
                      <Col xs={6} sm={3}>
                        <div className="small text-muted">Horario</div>
                        <div className="small">
                          {formatHora(inicio)} — {formatHora(fin)}
                        </div>
                      </Col>
                      <Col xs={6} sm={3}>
                        <div className="small text-muted">Sala</div>
                        <div className="small">{r.NOMBRE_SALA || '—'}</div>
                      </Col>
                      <Col xs={6} sm={3}>
                        <div className="small text-muted">Módulos</div>
                        <div className="small">
                          {r.CANTIDAD_MODULOS_RESERVA ??
                            (modulos.length > 0
                              ? modulos.length
                              : (r.CANTIDAD_MODULOS_EXAMEN ?? '—'))}
                        </div>
                      </Col>
                      <Col xs={6} sm={4}>
                        <div className="small text-muted">Estado</div>
                        <div>{estadoBadge(r.ESTADO_RESERVA)}</div>
                      </Col>
                      <Col xs={6} sm={4}>
                        <div className="small text-muted">
                          Confirmación docente
                        </div>
                        <div>
                          {confirmacionBadge(r.ESTADO_CONFIRMACION_DOCENTE)}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Módulos (solo si hay datos) */}
                  {modulos.length > 0 && (
                    <div className="border rounded p-2">
                      <div className="small fw-bold text-warning mb-1">
                        <i className="bi bi-clock me-1" />
                        Módulos asignados
                      </div>
                      <table className="table table-sm table-bordered mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: 36 }}>#</th>
                            <th>Módulo</th>
                            <th>Inicio</th>
                            <th>Fin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modulos.map((m, idx) => (
                            <tr key={m.ID_MODULO ?? idx}>
                              <td>{idx + 1}</td>
                              <td>
                                {m.NOMBRE_MODULO || `Módulo ${m.ID_MODULO}`}
                              </td>
                              <td>{formatHora(m.INICIO_MODULO)}</td>
                              <td>{formatHora(m.FIN_MODULO)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Observaciones */}
                  {(r.OBSERVACIONES_DOCENTE || r.OBSERVACIONES || r.NOTAS) && (
                    <div className="border rounded p-2">
                      <div className="small fw-bold mb-1">
                        <i className="bi bi-chat-left-text me-1" />
                        Observaciones
                      </div>
                      <p className="small mb-0">
                        {r.OBSERVACIONES_DOCENTE || r.OBSERVACIONES || r.NOTAS}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDetalle}>
            Cerrar
          </Button>
          {canEdit && detalleModal.reserva && (
            <Button
              variant="outline-secondary"
              onClick={() => {
                handleCloseDetalle();
                handleOpenEdit(detalleModal.reserva);
              }}
            >
              <i className="bi bi-pencil me-1" />
              Editar
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Layout>
  );
}
