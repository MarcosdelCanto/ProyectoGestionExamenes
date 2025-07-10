// src/pages/MisReservasAsignadasPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Spinner,
  Alert,
  Button,
  Modal,
  Card,
  Badge,
  Form,
  Nav,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import Layout from '../components/Layout';
import ReservaForm from '../components/reservas/ReservaForm';
import * as authService from '../services/authService';
import {
  fetchMisAsignacionesDeReservas,
  updateReserva,
  actualizarConfirmacionReservaDocente,
  descartarReservaService,
  crearReservaParaExamenExistenteService as crearReservaParaExamenExistente,
} from '../services/reservaService';

import { useDispatch } from 'react-redux';
import { procesarActualizacionReservaSocket } from '../store/reservasSlice';

const MisReservasAsignadasPage = () => {
  const dispatch = useDispatch();
  const user = authService.getCurrentUser();

  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(
    user?.nombre_rol === 'DOCENTE' ? 'pendientes' : 'proximas'
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentReservaToEdit, setCurrentReservaToEdit] = useState(null);
  const [loadingEditModal, setLoadingEditModal] = useState(false);
  const [modalEditError, setModalEditError] = useState(null);
  const [modalEditTitle, setModalEditTitle] = useState('Editar Reserva');
  const [modalEditSuccess, setModalEditSuccess] = useState(null);
  const [showRevisarModal, setShowRevisarModal] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [historialObservaciones, setHistorialObservaciones] = useState('');
  const [nuevaObservacionDocente, setNuevaObservacionDocente] = useState('');
  const [nuevoEstadoConfirmacionDocente, setNuevoEstadoConfirmacionDocente] =
    useState('CONFIRMADO');
  const [loadingRevisarModal, setLoadingRevisarModal] = useState(false);
  const [modalRevisarError, setModalRevisarError] = useState(null);
  const [modalRevisarSuccess, setModalRevisarSuccess] = useState(null);
  const [showObservacionesModal, setShowObservacionesModal] = useState(false);
  const [observacionesParaMostrar, setObservacionesParaMostrar] = useState('');
  const [
    reservaSeleccionadaParaObservaciones,
    setReservaSeleccionadaParaObservaciones,
  ] = useState(null);
  const [showConfirmDescartarModal, setShowConfirmDescartarModal] =
    useState(false);
  const [reservaParaDescartar, setReservaParaDescartar] = useState(null);
  const [loadingDescartar, setLoadingDescartar] = useState(false);

  // Efecto para manejar z-index cuando se abren modales
  useEffect(() => {
    const anyModalOpen =
      showEditModal ||
      showRevisarModal ||
      showObservacionesModal ||
      showConfirmDescartarModal;

    if (anyModalOpen) {
      // Cuando cualquier modal está abierto, ajustar z-index del sidebar y overlay
      const sidebar = document.querySelector('.offcanvas.offcanvas-start');
      const sidebarOverlay = document.querySelector('.sidebar-overlay');

      if (sidebar) {
        sidebar.style.zIndex = '1060'; // Mayor que el backdrop del modal (1055)
      }
      if (sidebarOverlay) {
        sidebarOverlay.style.zIndex = '1059'; // Entre el modal y el sidebar
      }
    } else {
      // Cuando no hay modales abiertos, restaurar z-index originales
      const sidebar = document.querySelector('.offcanvas.offcanvas-start');
      const sidebarOverlay = document.querySelector('.sidebar-overlay');

      if (sidebar) {
        sidebar.style.zIndex = '1045'; // Z-index original
      }
      if (sidebarOverlay) {
        sidebarOverlay.style.zIndex = '1040'; // Z-index original
      }
    }

    // Cleanup al desmontar
    return () => {
      const sidebar = document.querySelector('.offcanvas.offcanvas-start');
      const sidebarOverlay = document.querySelector('.sidebar-overlay');

      if (sidebar) {
        sidebar.style.zIndex = '1045';
      }
      if (sidebarOverlay) {
        sidebarOverlay.style.zIndex = '1040';
      }
    };
  }, [
    showEditModal,
    showRevisarModal,
    showObservacionesModal,
    showConfirmDescartarModal,
  ]);

  // Efecto para corregir z-index al cargar la página
  useEffect(() => {
    // Ejecutar después de que el Layout se haya montado completamente
    const timer = setTimeout(() => {
      const sidebar = document.querySelector('.offcanvas.offcanvas-start');
      const sidebarOverlay = document.querySelector('.sidebar-overlay');

      if (sidebar && !sidebar.style.zIndex) {
        sidebar.style.zIndex = '1045';
      }
      if (sidebarOverlay && !sidebarOverlay.style.zIndex) {
        sidebarOverlay.style.zIndex = '1040';
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Solo ejecutar una vez al montar

  const cargarAsignaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMisAsignacionesDeReservas();
      setAsignaciones(data || []);
    } catch (err) {
      setError('Error al cargar tus asignaciones. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarAsignaciones();
  }, [cargarAsignaciones]);

  const handleSubmitConfirmacion = async () => {
    if (!selectedReserva) return;
    setLoadingRevisarModal(true);
    setModalRevisarError(null);
    try {
      const datosConfirmacion = {
        nuevoEstado: nuevoEstadoConfirmacionDocente.trim(),
        observaciones: nuevaObservacionDocente,
      };
      const reservaActualizadaDesdeAPI =
        await actualizarConfirmacionReservaDocente(
          selectedReserva.ID_RESERVA,
          datosConfirmacion
        );
      const payloadParaStore = reservaActualizadaDesdeAPI || {
        ...selectedReserva,
        ESTADO_CONFIRMACION_DOCENTE: nuevoEstadoConfirmacionDocente.trim(),
        OBSERVACIONES_DOCENTE:
          `${nuevaObservacionDocente}\n${historialObservaciones}`.trim(),
      };
      dispatch(procesarActualizacionReservaSocket(payloadParaStore));
      setModalRevisarSuccess('Actualización enviada correctamente.');
      await cargarAsignaciones();
      setTimeout(() => handleCloseRevisarModal(), 1500);
    } catch (err) {
      setModalRevisarError(
        err.details || err.error || 'Error al actualizar la reserva.'
      );
    } finally {
      setLoadingRevisarModal(false);
    }
  };

  const handleOpenEditModal = (reserva) => {
    if (reserva) {
      const formatFechaParaMostrar = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      };
      const dataForEditForm = {
        ID_RESERVA: reserva.ID_RESERVA,
        examen: {
          value: reserva.ID_EXAMEN,
          label: reserva.NOMBRE_EXAMEN,
          CANTIDAD_MODULOS_EXAMEN: reserva.CANTIDAD_MODULOS_EXAMEN,
          seccionId: reserva.ID_SECCION,
        },
        sala: { value: reserva.ID_SALA, label: reserva.NOMBRE_SALA },
        docente: {
          value: reserva.ID_DOCENTE_PRINCIPAL,
          label: reserva.NOMBRE_DOCENTE_PRINCIPAL,
        },
        fechaReserva: new Date(reserva.FECHA_RESERVA)
          .toISOString()
          .split('T')[0],
        modulosIds: reserva.MODULOS_IDS_ARRAY || [],
        fechaReservaOriginal: formatFechaParaMostrar(reserva.FECHA_RESERVA),
        salaOriginalNombre: reserva.NOMBRE_SALA,
        docenteOriginalNombre: reserva.NOMBRE_DOCENTE_PRINCIPAL,
        observacionesDocenteOriginal: reserva.OBSERVACIONES_DOCENTE || '',
        modulosOriginalesNombres: reserva.MODULOS_NOMBRES_ARRAY || [],
      };
      setCurrentReservaToEdit(dataForEditForm);
      setModalEditTitle(`Editar Reserva #${reserva.ID_RESERVA}`);
      setShowEditModal(true);
    }
  };
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setCurrentReservaToEdit(null);
    setModalEditError(null);
    setModalEditSuccess(null);
  };
  const handleOpenCrearReservaModal = () => {
    setModalEditTitle('Crear Nueva Reserva');
    setCurrentReservaToEdit(null);
    setShowEditModal(true);
  };
  const handleCreateReserva = async (formDataPayload) => {
    setLoadingEditModal(true);
    setModalEditError(null);
    setModalEditSuccess(null);
    try {
      await crearReservaParaExamenExistente(formDataPayload);
      setModalEditSuccess('Reserva creada exitosamente.');
      await cargarAsignaciones();
      setTimeout(() => handleCloseEditModal(), 1500);
    } catch (err) {
      setModalEditError(
        err.details || err.error || 'Error al crear la reserva.'
      );
    } finally {
      setLoadingEditModal(false);
    }
  };
  const handleUpdateReserva = async (formDataPayload) => {
    if (!currentReservaToEdit?.ID_RESERVA) return;
    setLoadingEditModal(true);
    setModalEditError(null);
    setModalEditSuccess(null);
    try {
      await updateReserva(currentReservaToEdit.ID_RESERVA, formDataPayload);
      setModalEditSuccess('Reserva actualizada exitosamente.');
      await cargarAsignaciones();
      setTimeout(() => handleCloseEditModal(), 1500);
    } catch (err) {
      setModalEditError(
        err.details || err.error || 'Error al actualizar la reserva.'
      );
    } finally {
      setLoadingEditModal(false);
    }
  };
  const handleOpenRevisarModal = (reserva) => {
    setSelectedReserva(reserva);
    setHistorialObservaciones(reserva.OBSERVACIONES_DOCENTE || '');
    setNuevaObservacionDocente('');
    setNuevoEstadoConfirmacionDocente('CONFIRMADO');
    setShowRevisarModal(true);
  };
  const handleCloseRevisarModal = () => {
    setShowRevisarModal(false);
    setSelectedReserva(null);
    setHistorialObservaciones('');
    setNuevaObservacionDocente('');
    setModalRevisarError(null);
    setModalRevisarSuccess(null);
  };
  const handleOpenObservacionesModal = (reserva) => {
    setObservacionesParaMostrar(
      reserva.OBSERVACIONES_DOCENTE || 'No hay observaciones registradas.'
    );
    setReservaSeleccionadaParaObservaciones(reserva);
    setShowObservacionesModal(true);
  };
  const handleCloseObservacionesModal = () => {
    setShowObservacionesModal(false);
    setObservacionesParaMostrar('');
    setReservaSeleccionadaParaObservaciones(null);
  };
  const handleOpenConfirmDescartarModal = (reserva) => {
    setReservaParaDescartar(reserva);
    setShowConfirmDescartarModal(true);
    setModalEditError(null);
  };
  const handleCloseConfirmDescartarModal = () => {
    setReservaParaDescartar(null);
    setShowConfirmDescartarModal(false);
  };
  const handleConfirmDescartarReserva = async () => {
    if (!reservaParaDescartar) return;
    setLoadingDescartar(true);
    setModalEditError(null);
    try {
      await descartarReservaService(reservaParaDescartar.ID_RESERVA);
      setModalEditSuccess('Reserva descartada exitosamente.');
      cargarAsignaciones();
      handleCloseConfirmDescartarModal();
    } catch (err) {
      setModalEditError(
        err.details || err.error || 'Error al descartar la reserva.'
      );
    } finally {
      setLoadingDescartar(false);
    }
  };

  // --- LÓGICA DE PERMISOS (DECLARACIÓN CORREGIDA) ---
  // Esta declaración debe estar antes del return principal
  const esAdminOComite =
    user &&
    [
      'ADMINISTRADOR',
      'COORDINADOR CARRERA',
      'COORDINADOR DOCENTE',
      'JEFE CARRERA',
    ].includes(user?.nombre_rol);
  const esDocente = user && user?.nombre_rol === 'DOCENTE';

  if (loading) {
    return (
      <Layout>
        <div className="text-center mt-5">
          <Spinner />
        </div>
      </Layout>
    );
  }

  const reservasParaRevision = asignaciones.filter(
    (res) => res.ESTADO_CONFIRMACION_DOCENTE === 'REQUIERE_REVISION'
  );
  const reservasPendientesDocente = asignaciones.filter(
    (res) => res.ESTADO_CONFIRMACION_DOCENTE === 'PENDIENTE'
  );

  return (
    <Layout>
      <div className="container-fluid pt-4">
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb">
            <h2 className="display-6 mb-0">
              <i className="bi bi-calendar-check-fill me-3"></i> Exámenes
              Programados
            </h2>
            <div className="d-flex gap-2">
              {esAdminOComite && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCrearReservaModal}
                >
                  <i className="bi bi-plus-lg me-2"></i> Crear Reserva
                </Button>
              )}
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={cargarAsignaciones}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-2"></i> Actualizar
              </Button>
            </div>
          </div>
          <hr className="mt-2 mb-4" />
        </div>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <Nav
          variant="tabs"
          className="mb-3 nav-custom"
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
        >
          <Nav.Item>
            <Nav.Link eventKey="proximas">Mis Próximas Reservas</Nav.Link>
          </Nav.Item>
          {esAdminOComite && (
            <Nav.Item>
              <Nav.Link eventKey="revision">
                Requieren Revisión
                {reservasParaRevision.length > 0 && (
                  <Badge bg="danger" className="ms-2" pill>
                    {reservasParaRevision.length}
                  </Badge>
                )}
              </Nav.Link>
            </Nav.Item>
          )}
          {esDocente && (
            <Nav.Item>
              <Nav.Link eventKey="pendientes">
                Pendientes de Confirmación
                {reservasPendientesDocente.length > 0 && (
                  <Badge bg="warning" text="dark" className="ms-2" pill>
                    {reservasPendientesDocente.length}
                  </Badge>
                )}
              </Nav.Link>
            </Nav.Item>
          )}
        </Nav>

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {activeTab === 'proximas' && (
              <div className="p-3">
                {asignaciones.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover bordered className="align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Examen</th>
                          <th>Asignatura</th>
                          <th>Fecha</th>
                          <th>Horario</th>
                          <th>Sala</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asignaciones.map((res) => (
                          <tr key={res.ID_RESERVA}>
                            <td>{res.NOMBRE_EXAMEN}</td>
                            <td>{res.NOMBRE_ASIGNATURA}</td>
                            <td>
                              {new Date(res.FECHA_RESERVA).toLocaleDateString(
                                'es-CL'
                              )}
                            </td>
                            <td>
                              {res.HORA_INICIO} - {res.HORA_FIN}
                            </td>
                            <td>{res.NOMBRE_SALA}</td>
                            <td className="text-center align-middle">
                              <Badge
                                bg={
                                  res.ESTADO_CONFIRMACION_DOCENTE ===
                                  'CONFIRMADO'
                                    ? 'success'
                                    : res.ESTADO_CONFIRMACION_DOCENTE ===
                                        'PENDIENTE'
                                      ? 'warning'
                                      : 'danger'
                                }
                              >
                                {res.ESTADO_CONFIRMACION_DOCENTE}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="light" className="text-center m-3">
                    No tienes reservas próximas asignadas.
                  </Alert>
                )}
              </div>
            )}
            {activeTab === 'revision' && esAdminOComite && (
              <div className="p-3">
                {reservasParaRevision.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover bordered className="align-middle mt-0">
                      <thead className="table-light">
                        <tr>
                          <th>Examen</th>
                          <th>Asignatura</th>
                          <th>Fecha</th>
                          <th>Horario</th>
                          <th>Sala</th>
                          <th>Observaciones</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservasParaRevision.map((res) => (
                          <tr key={res.ID_RESERVA}>
                            <td>{res.NOMBRE_EXAMEN}</td>
                            <td>{res.NOMBRE_ASIGNATURA}</td>
                            <td>
                              {new Date(res.FECHA_RESERVA).toLocaleDateString(
                                'es-CL'
                              )}
                            </td>
                            <td>
                              {res.HORA_INICIO} - {res.HORA_FIN}
                            </td>
                            <td>{res.NOMBRE_SALA}</td>
                            <td className="text-center">
                              {res.OBSERVACIONES_DOCENTE && (
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Presiona para ver</Tooltip>}
                                >
                                  <Button
                                    variant="link"
                                    onClick={() =>
                                      handleOpenObservacionesModal(res)
                                    }
                                    className="p-1"
                                  >
                                    <i className="bi bi-chat-square-quote fs-4"></i>
                                  </Button>
                                </OverlayTrigger>
                              )}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="warning"
                                  size="sm"
                                  onClick={() => handleOpenEditModal(res)}
                                >
                                  <i className="bi bi-pencil-square fs-6"></i>
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenConfirmDescartarModal(res)
                                  }
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="light" className="text-center m-3">
                    No hay reservas que requieran revisión.
                  </Alert>
                )}
              </div>
            )}
            {activeTab === 'pendientes' && esDocente && (
              <div className="p-3">
                {reservasPendientesDocente.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover bordered className="align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Examen</th>
                          <th>Asignatura</th>
                          <th>Fecha</th>
                          <th>Horario</th>
                          <th>Sala</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservasPendientesDocente.map((res) => (
                          <tr key={res.ID_RESERVA}>
                            <td>{res.NOMBRE_EXAMEN}</td>
                            <td>{res.NOMBRE_ASIGNATURA}</td>
                            <td>
                              {new Date(res.FECHA_RESERVA).toLocaleDateString(
                                'es-CL'
                              )}
                            </td>
                            <td>
                              {res.HORA_INICIO} - {res.HORA_FIN}
                            </td>
                            <td>{res.NOMBRE_SALA}</td>
                            <td className="text-center align-middle">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleOpenRevisarModal(res)}
                              >
                                Revisar y Confirmar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="light" className="text-center m-3">
                    No tienes reservas pendientes de confirmación.
                  </Alert>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      <Modal
        show={showEditModal}
        onHide={handleCloseEditModal}
        size="lg"
        backdrop="static"
        centered
        style={{ zIndex: 1055 }} // Asegurar z-index específico para este modal
        backdropClassName="modal-backdrop-custom" // Clase personalizada para el backdrop
      >
        <Modal.Header closeButton>
          <Modal.Title>{modalEditTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalEditError && (
            <Alert
              variant="danger"
              onClose={() => setModalEditError(null)}
              dismissible
            >
              {modalEditError}
            </Alert>
          )}
          {modalEditSuccess && (
            <Alert variant="success">{modalEditSuccess}</Alert>
          )}
          <ReservaForm
            key={
              currentReservaToEdit
                ? currentReservaToEdit.ID_RESERVA
                : 'crear-reserva'
            }
            initialData={currentReservaToEdit}
            onSubmit={
              currentReservaToEdit ? handleUpdateReserva : handleCreateReserva
            }
            onCancel={handleCloseEditModal}
            isLoadingExternally={loadingEditModal}
            submitButtonText={
              currentReservaToEdit ? 'Guardar Cambios' : 'Crear Reserva'
            }
            isEditMode={!!currentReservaToEdit}
          />
        </Modal.Body>
      </Modal>

      <Modal
        show={showRevisarModal}
        onHide={handleCloseRevisarModal}
        centered
        style={{ zIndex: 1055 }}
        backdropClassName="modal-backdrop-custom"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Revisar Reserva: {selectedReserva?.NOMBRE_EXAMEN}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalRevisarError && (
            <Alert variant="danger">{modalRevisarError}</Alert>
          )}
          {modalRevisarSuccess && (
            <Alert variant="success">{modalRevisarSuccess}</Alert>
          )}
          {selectedReserva && (
            <>
              <h5>Detalles de la Reserva</h5>
              <p>
                <strong>Asignatura:</strong> {selectedReserva.NOMBRE_ASIGNATURA}
              </p>
              <p>
                <strong>Fecha:</strong>
                {new Date(selectedReserva.FECHA_RESERVA).toLocaleDateString(
                  'es-CL'
                )}
                | <strong>Horario:</strong> {selectedReserva.HORA_INICIO} -
                {selectedReserva.HORA_FIN}
              </p>
              <p>
                <strong>Sala:</strong> {selectedReserva.NOMBRE_SALA} (
                {selectedReserva.NOMBRE_EDIFICIO})
              </p>
              <hr />
              {historialObservaciones && (
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    Historial de Observaciones:
                  </Form.Label>
                  <div
                    className="p-2 border rounded bg-light"
                    style={{
                      maxHeight: '150px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {historialObservaciones}
                  </div>
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Añadir Nueva Observación (opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={nuevaObservacionDocente}
                  onChange={(e) => setNuevaObservacionDocente(e.target.value)}
                  placeholder="Ej: La sala no cuenta con proyector."
                />
              </Form.Group>
              <Form.Group>
                <Form.Label className="fw-bold">Acción a Realizar:</Form.Label>
                <div>
                  <Form.Check
                    type="radio"
                    label="Confirmar Reserva"
                    name="estadoConfirmacion"
                    value="CONFIRMADO"
                    checked={nuevoEstadoConfirmacionDocente === 'CONFIRMADO'}
                    onChange={(e) =>
                      setNuevoEstadoConfirmacionDocente(e.target.value)
                    }
                  />
                  <Form.Check
                    type="radio"
                    label="Requiere Revisión (dejar observaciones)"
                    name="estadoConfirmacion"
                    value="REQUIERE_REVISION"
                    checked={
                      nuevoEstadoConfirmacionDocente === 'REQUIERE_REVISION'
                    }
                    onChange={(e) =>
                      setNuevoEstadoConfirmacionDocente(e.target.value)
                    }
                  />
                </div>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseRevisarModal}
            disabled={loadingRevisarModal}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitConfirmacion}
            disabled={loadingRevisarModal}
          >
            {loadingRevisarModal ? (
              <Spinner as="span" size="sm" />
            ) : (
              'Enviar Actualización'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showObservacionesModal}
        onHide={handleCloseObservacionesModal}
        centered
        style={{ zIndex: 1055 }}
        backdropClassName="modal-backdrop-custom"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Observaciones para Reserva #
            {reservaSeleccionadaParaObservaciones?.ID_RESERVA}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            style={{
              whiteSpace: 'pre-wrap',
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            {observacionesParaMostrar}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseObservacionesModal}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showConfirmDescartarModal}
        onHide={handleCloseConfirmDescartarModal}
        centered
        style={{ zIndex: 1055 }}
        backdropClassName="modal-backdrop-custom"
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Descarte de Reserva</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalEditError && (
            <Alert
              variant="danger"
              onClose={() => setModalEditError(null)}
              dismissible
            >
              {modalEditError}
            </Alert>
          )}
          <p>
            ¿Estás seguro de que quieres descartar la reserva para el examen
            <strong>{reservaParaDescartar?.NOMBRE_EXAMEN}</strong> del
            {reservaParaDescartar &&
              new Date(reservaParaDescartar.FECHA_RESERVA).toLocaleDateString(
                'es-CL'
              )}
            ?
          </p>
          <p className="text-muted small">
            Esta acción cambiará el estado de la reserva a "DESCARTADO",
            reactivará el examen asociado y liberará los módulos. La reserva no
            se eliminará permanentemente.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseConfirmDescartarModal}
            disabled={loadingDescartar}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDescartarReserva}
            disabled={loadingDescartar}
          >
            {loadingDescartar ? (
              <Spinner as="span" size="sm" />
            ) : (
              'Sí, Descartar'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};

export default MisReservasAsignadasPage;
