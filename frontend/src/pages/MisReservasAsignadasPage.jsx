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
  descartarReservaService, // Renombrar para evitar colisión
  crearReservaParaExamenExistenteService as crearReservaParaExamenExistente, // Corregir importación
} from '../services/reservaService';

import { useDispatch } from 'react-redux'; // <-- IMPORTAR useDispatch
import { actualizarEstadoConfirmacionReserva } from '../store/reservasSlice'; // <-- IMPORTAR LA ACCIÓN
const MisReservasAsignadasPage = () => {
  // Obtiene el usuario actual desde el servicio de autenticación
  const user = authService.getCurrentUser();

  // --- Estados para la página principal ---
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(
    user?.nombre_rol === 'DOCENTE' ? 'pendientes' : 'proximas' // Añadir optional chaining por si user es null
  );

  // --- Estados para el modal de EDICIÓN (para admins/coordinadores) ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentReservaToEdit, setCurrentReservaToEdit] = useState(null);
  const [loadingEditModal, setLoadingEditModal] = useState(false);
  const [modalEditError, setModalEditError] = useState(null);
  const [modalEditTitle, setModalEditTitle] = useState('Editar Reserva'); // Para título dinámico
  const [modalEditSuccess, setModalEditSuccess] = useState(null);

  // --- Estados para el modal de REVISIÓN (para docentes) ---
  const [showRevisarModal, setShowRevisarModal] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [historialObservaciones, setHistorialObservaciones] = useState('');
  const [nuevaObservacionDocente, setNuevaObservacionDocente] = useState(''); // Para ingresar la nueva observación
  const [nuevoEstadoConfirmacionDocente, setNuevoEstadoConfirmacionDocente] = // Renombrado para claridad
    useState('CONFIRMADO');
  const [loadingRevisarModal, setLoadingRevisarModal] = useState(false);
  const [modalRevisarError, setModalRevisarError] = useState(null);
  const [modalRevisarSuccess, setModalRevisarSuccess] = useState(null);

  // --- Estados para el modal de VER OBSERVACIONES ---
  const [showObservacionesModal, setShowObservacionesModal] = useState(false);
  const [observacionesParaMostrar, setObservacionesParaMostrar] = useState('');
  const [
    reservaSeleccionadaParaObservaciones,
    setReservaSeleccionadaParaObservaciones,
  ] = useState(null);

  // --- Estados para el modal de CONFIRMAR DESCARTE ---
  const [showConfirmDescartarModal, setShowConfirmDescartarModal] =
    useState(false);
  const [reservaParaDescartar, setReservaParaDescartar] = useState(null);

  const dispatch = useDispatch(); // <-- OBTENER LA FUNCIÓN DISPATCH
  const [loadingDescartar, setLoadingDescartar] = useState(false);

  // --- Carga de Datos ---
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

  // --- Lógica del Modal de Edición ---
  const handleOpenEditModal = (reserva) => {
    if (reserva) {
      console.log(
        '[MisReservasAsignadasPage] Reserva recibida para edición:',
        JSON.parse(JSON.stringify(reserva))
      ); // <-- Añadir este log
      // Helper function to format date for display (e.g., DD/MM/YYYY)
      const formatFechaParaMostrar = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      };

      // Prepara el objeto `initialData` que `ReservaForm` usará.
      // Es crucial que el `ReservaForm` reciba los datos en el formato que espera.
      const dataForEditForm = {
        // Datos para los campos del formulario
        ID_RESERVA: reserva.ID_RESERVA, // Estandarizar a ID_RESERVA
        examen: {
          value: reserva.ID_EXAMEN,
          label: reserva.NOMBRE_EXAMEN,
          // Asegúrate de que estos campos vengan de fetchMisAsignacionesDeReservas si son necesarios en ReservaForm
          CANTIDAD_MODULOS_EXAMEN: reserva.CANTIDAD_MODULOS_EXAMEN,
          seccionId: reserva.ID_SECCION, // o el nombre correcto de la propiedad
        },
        sala: { value: reserva.ID_SALA, label: reserva.NOMBRE_SALA },
        docente: {
          value: reserva.ID_DOCENTE_PRINCIPAL,
          label: reserva.NOMBRE_DOCENTE_PRINCIPAL,
          // SECCIONES: reserva.SECCIONES_DOCENTE, // Si es necesario para formatDocenteOptionLabel
        },
        fechaReserva: new Date(reserva.FECHA_RESERVA)
          .toISOString()
          .split('T')[0],
        modulosIds: reserva.MODULOS_IDS_ARRAY || [],
        // Datos para mostrar la información original
        fechaReservaOriginal: formatFechaParaMostrar(reserva.FECHA_RESERVA),
        salaOriginalNombre: reserva.NOMBRE_SALA,
        docenteOriginalNombre: reserva.NOMBRE_DOCENTE_PRINCIPAL, // Añadir nombre del docente original
        observacionesDocenteOriginal: reserva.OBSERVACIONES_DOCENTE || '', // Añadir observaciones
        modulosOriginalesNombres: reserva.MODULOS_NOMBRES_ARRAY || [], // Asume que tienes un array de nombres de módulos
      };
      setCurrentReservaToEdit(dataForEditForm);
      console.log(
        '[MisReservasAsignadasPage] initialData preparado:',
        JSON.parse(JSON.stringify(dataForEditForm)) // Loguear el objeto que se va a setear
      );
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
    setCurrentReservaToEdit(null); // Indica modo creación
    setShowEditModal(true);
  };

  const handleCreateReserva = async (formDataPayload) => {
    console.log('[MisReservasAsignadasPage] handleCreateReserva llamado con:', {
      formDataPayload,
    });

    setLoadingEditModal(true);
    setModalEditError(null);
    setModalEditSuccess(null);

    // El payload para crearReservaParaExamenExistente
    const payloadForBackend = {
      examen_id_examen: formDataPayload.examen_id_examen,
      fecha_reserva: formDataPayload.fecha_reserva,
      sala_id_sala: formDataPayload.sala_id_sala,
      modulos_ids: formDataPayload.modulos_ids,
      docente_ids: formDataPayload.docente_ids,
    };

    try {
      await crearReservaParaExamenExistente(payloadForBackend);
      setModalEditSuccess('Reserva creada exitosamente.');
      await cargarAsignaciones();
      setTimeout(() => handleCloseEditModal(), 1500);
    } catch (err) {
      console.error(
        '[MisReservasAsignadasPage] Error en handleCreateReserva:',
        err
      );
      setModalEditError(
        err.details || err.error || 'Error al crear la reserva.'
      );
    } finally {
      setLoadingEditModal(false);
    }
  };

  const handleUpdateReserva = async (formDataPayload) => {
    if (!currentReservaToEdit?.ID_RESERVA) {
      console.error(
        '[MisReservasAsignadasPage] Error: currentReservaToEdit o su ID es nulo/undefined. No se puede actualizar.'
      );
      return;
    }

    // ESTE LOG ES EL SIGUIENTE A VERIFICAR EN LA CONSOLA DEL NAVEGADOR
    console.log('[MisReservasAsignadasPage] handleUpdateReserva llamado con:', {
      currentReservaToEditId: currentReservaToEdit.ID_RESERVA,
      formDataPayload, // Este debería coincidir con el payload del log de ReservaForm
    });

    setLoadingEditModal(true);
    setModalEditError(null);
    setModalEditSuccess(null);

    const payloadForBackend = {
      fecha_reserva: formDataPayload.fecha_reserva,
      sala_id_sala: formDataPayload.sala_id_sala,
      modulos_ids: formDataPayload.modulos_ids,
    };

    if (formDataPayload.docente_ids && formDataPayload.docente_ids.length > 0) {
      payloadForBackend.docente_ids = formDataPayload.docente_ids;
    }

    try {
      console.log(
        '[MisReservasAsignadasPage] Intentando llamar a updateReserva (servicio) con ID:',
        currentReservaToEdit.ID_RESERVA,
        'y payload:',
        payloadForBackend
      );

      // AQUÍ ES DONDE SE LLAMA AL SERVICIO QUE HACE LA PETICIÓN PUT AL BACKEND
      console.log(
        '[MisReservasAsignadasPage] Enviando al backend:',
        payloadForBackend
      ); // Log antes de la llamada
      await updateReserva(currentReservaToEdit.ID_RESERVA, payloadForBackend);

      // Si la línea anterior no da error, esto debería ejecutarse:
      setModalEditSuccess('Reserva actualizada exitosamente.');
      await cargarAsignaciones();
      setTimeout(() => handleCloseEditModal(), 1500);
    } catch (err) {
      // Si hay un error en la llamada a updateReserva o en cargarAsignaciones, se ejecuta esto:
      console.error(
        '[MisReservasAsignadasPage] Error en handleUpdateReserva:',
        err
      ); // Log del error
      setModalEditError(
        err.details || err.error || 'Error al actualizar la reserva.'
      );
    } finally {
      setLoadingEditModal(false);
    }
  };

  // --- Lógica del Modal de Revisión ---
  const handleOpenRevisarModal = (reserva) => {
    setSelectedReserva(reserva);
    setHistorialObservaciones(reserva.OBSERVACIONES_DOCENTE || '');
    setNuevaObservacionDocente(''); // Limpiar campo para nueva observación
    setNuevoEstadoConfirmacionDocente('CONFIRMADO');
    setShowRevisarModal(true);
  };

  const handleCloseRevisarModal = () => {
    setShowRevisarModal(false);
    setSelectedReserva(null);
    setHistorialObservaciones(''); // Limpiar historial al cerrar
    setNuevaObservacionDocente('');
    setModalRevisarError(null);
    setModalRevisarSuccess(null);
  };

  const handleSubmitConfirmacion = async () => {
    setModalRevisarError(null);
    setModalRevisarSuccess(null);
    if (!selectedReserva) return;
    setLoadingRevisarModal(true);
    try {
      await actualizarConfirmacionReservaDocente(selectedReserva.ID_RESERVA, {
        nuevoEstado: nuevoEstadoConfirmacionDocente.trim(), // Asegurar que no haya espacios
        observaciones: nuevaObservacionDocente, // Enviar solo la nueva observación
      });
      setModalRevisarSuccess('Actualización enviada correctamente.');

      // Despachar acción a Redux para actualizar el estado global
      dispatch(
        actualizarEstadoConfirmacionReserva({
          id_reserva: selectedReserva.ID_RESERVA,
          nuevo_estado_confirmacion_docente:
            nuevoEstadoConfirmacionDocente.trim(),
          // Opcional: si el backend devuelve las observaciones actualizadas o la fecha, pasarlas también
          // observaciones_docente: respuestaDelBackend.observaciones_actualizadas,
          // fecha_confirmacion_docente: respuestaDelBackend.fecha_confirmacion,
        })
      );
      console.log(
        '[MisReservasAsignadasPage] Acción Redux despachada para actualizar estado de reserva.'
      );

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

  // --- Lógica del Modal de Ver Observaciones ---
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

  // --- Lógica del Modal de Descartar Reserva ---
  const handleOpenConfirmDescartarModal = (reserva) => {
    setReservaParaDescartar(reserva);
    setShowConfirmDescartarModal(true);
    setModalEditError(null); // Limpiar errores previos del modal de edición
  };

  const handleCloseConfirmDescartarModal = () => {
    setReservaParaDescartar(null);
    setShowConfirmDescartarModal(false);
  };

  const handleConfirmDescartarReserva = async () => {
    if (!reservaParaDescartar) return;
    setLoadingDescartar(true);
    setModalEditError(null); // Usar el mismo estado de error para simplicidad o crear uno nuevo
    try {
      await descartarReservaService(reservaParaDescartar.ID_RESERVA);
      setModalEditSuccess('Reserva descartada exitosamente.'); // O un estado de éxito específico
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
  // --- Lógica de Permisos ---
  const esAdminOComite =
    user &&
    [
      // Añadir optional chaining por si user es null
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
              <i className="bi bi-calendar-check-fill me-3"></i>
              Exámenes Programados
            </h2>
            <div className="d-flex gap-2">
              {esAdminOComite && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCrearReservaModal}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Crear Reserva
                </Button>
              )}
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={cargarAsignaciones}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Actualizar
              </Button>
            </div>
          </div>
          <hr className="mt-2 mb-4" />
        </div>

        {/* Alert Messages */}

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {/* Tabs de naveagción */}
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

        {/* tab content */}
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
                  <Alert variant="light" className="text-center mt-0">
                    No tienes reservas asignadas.
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
                                  overlay={
                                    <Tooltip
                                      id={`tooltip-observ-${res.ID_RESERVA}`}
                                    >
                                      Presiona para ver
                                    </Tooltip>
                                  }
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
                  <Alert variant="light" className="text-center mt-0">
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
                  <Alert variant="light" className="text-center">
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
          {/* Se renderiza siempre que el modal esté abierto. initialData y isEditMode controlan su comportamiento. */}
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
            isEditMode={!!currentReservaToEdit} // true si currentReservaToEdit existe, false si es null (modo creación)
          />
        </Modal.Body>
      </Modal>

      <Modal show={showRevisarModal} onHide={handleCloseRevisarModal} centered>
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
          <Button variant="secondary" onClick={handleCloseRevisarModal}>
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

      {/* Modal para Ver Observaciones */}
      <Modal
        show={showObservacionesModal}
        onHide={handleCloseObservacionesModal}
        centered
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

      {/* Modal de Confirmación para Descartar Reserva */}
      <Modal
        show={showConfirmDescartarModal}
        onHide={handleCloseConfirmDescartarModal}
        centered
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
