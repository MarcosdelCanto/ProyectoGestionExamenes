// src/pages/MisReservasAsignadasPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Spinner,
  Alert,
  Button,
  Modal,
  Tabs,
  Tab,
  Card,
  Badge,
  Form,
} from 'react-bootstrap';
import Layout from '../components/Layout'; // Ajusta la ruta a tu Layout principal
import ReservaForm from '../components/reservas/ReservaForm'; // Importa el formulario reutilizable
import * as authService from '../services/authService'; // Importa el servicio de autenticación
// Se importan todos los servicios de reserva necesarios
import {
  fetchMisAsignacionesDeReservas,
  updateReserva,
  actualizarConfirmacionReservaDocente,
} from '../services/reservaService';

const MisReservasAsignadasPage = () => {
  // Obtiene el usuario actual desde el servicio de autenticación
  const user = authService.getCurrentUser();

  // --- Estados para la página principal ---
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Determina la pestaña activa por defecto según el rol del usuario
  const [activeTab, setActiveTab] = useState(
    user.nombre_rol === 'DOCENTE' ? 'pendientes' : 'proximas'
  );

  // --- Estados para el modal de EDICIÓN (para admins/coordinadores) ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentReservaToEdit, setCurrentReservaToEdit] = useState(null);
  const [loadingEditModal, setLoadingEditModal] = useState(false);
  const [modalEditError, setModalEditError] = useState(null);
  const [modalEditSuccess, setModalEditSuccess] = useState(null);

  // --- Estados para el modal de REVISIÓN (para docentes) ---
  const [showRevisarModal, setShowRevisarModal] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [nuevoEstadoConfirmacion, setNuevoEstadoConfirmacion] =
    useState('CONFIRMADO');
  const [loadingRevisarModal, setLoadingRevisarModal] = useState(false);

  // --- Carga de datos ---
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
      setCurrentReservaToEdit({
        ID_RESERVA: reserva.ID_RESERVA,
        ID_EXAMEN: reserva.ID_EXAMEN,
        FECHA_RESERVA: reserva.FECHA_RESERVA,
        ID_SALA: reserva.ID_SALA,
        MODULOS_IDS: reserva.MODULOS_IDS_ARRAY || [],
        DOCENTES_IDS: reserva.DOCENTES_IDS_ARRAY || [],
      });
      setShowEditModal(true);
    }
  };
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setCurrentReservaToEdit(null);
    setModalEditError(null);
    setModalEditSuccess(null);
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

  // --- Lógica del Modal de Revisión para Docentes ---
  const handleOpenRevisarModal = (reserva) => {
    setSelectedReserva(reserva);
    setObservaciones(reserva.OBSERVACIONES_DOCENTE || '');
    setNuevoEstadoConfirmacion('CONFIRMADO');
    setShowRevisarModal(true);
  };
  const handleCloseRevisarModal = () => {
    setShowRevisarModal(false);
    setSelectedReserva(null);
    setObservaciones('');
  };
  const handleSubmitConfirmacion = async () => {
    if (!selectedReserva) return;
    setLoadingRevisarModal(true);
    setError(null);
    try {
      await actualizarConfirmacionReservaDocente(selectedReserva.ID_RESERVA, {
        nuevoEstado: nuevoEstadoConfirmacion,
        observaciones: observaciones,
      });
      handleCloseRevisarModal();
      await cargarAsignaciones();
    } catch (err) {
      // Idealmente, mostrar este error dentro del modal
      setError('Error al actualizar la reserva.');
    } finally {
      setLoadingRevisarModal(false);
    }
  };

  // --- Lógica de Permisos ---
  const esAdminOComite =
    user &&
    ['ADMINISTRADOR', 'COORDINADOR CARRERA', 'COORDINADOR DOCENTE'].includes(
      user.nombre_rol
    );
  const esDocente = user && user.nombre_rol === 'DOCENTE';

  // --- Renderizado de Contenido de Pestañas ---
  const renderTablaReservas = (data, esEditable = false) => {
    if (data.length === 0) {
      return (
        <Alert variant="light" className="text-center mt-3">
          No hay reservas que mostrar en esta categoría.
        </Alert>
      );
    }
    return (
      <Table striped bordered hover responsive size="sm" className="mt-3">
        <thead className="table-light">
          <tr>
            <th>Examen</th>
            <th>Asignatura</th>
            <th>Fecha</th>
            <th>Horario</th>
            <th>Sala</th>
            <th>Confirmación Docente</th>
            {esEditable && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((res) => (
            <tr key={res.ID_RESERVA}>
              <td>{res.NOMBRE_EXAMEN}</td>
              <td>{res.NOMBRE_ASIGNATURA}</td>
              <td>{new Date(res.FECHA_RESERVA).toLocaleDateString('es-CL')}</td>
              <td>
                {res.HORA_INICIO} - {res.HORA_FIN}
              </td>
              <td>{res.NOMBRE_SALA}</td>
              <td>
                <Badge
                  bg={
                    res.ESTADO_CONFIRMACION_DOCENTE === 'CONFIRMADO'
                      ? 'success'
                      : res.ESTADO_CONFIRMACION_DOCENTE === 'PENDIENTE'
                        ? 'warning'
                        : 'danger'
                  }
                >
                  {res.ESTADO_CONFIRMACION_DOCENTE}
                </Badge>
              </td>
              {esEditable && (
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleOpenEditModal(res)}
                  >
                    Editar
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center mt-5">
          <Spinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid pt-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="display-6 mb-3">Programación de Exámenes</h2>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={cargarAsignaciones}
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-arrow-clockwise"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"
              />
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
            </svg>
            <span className="ms-2">Actualizar</span>
          </Button>
        </div>
        <hr />
        {error && <Alert variant="danger">{error}</Alert>}

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          id="reservas-tabs"
          className="mb-3"
          fill
        >
          <Tab eventKey="proximas" title="Mis Próximas Reservas">
            <Card>
              <Card.Body>{renderTablaReservas(asignaciones)}</Card.Body>
            </Card>
          </Tab>

          {esAdminOComite && (
            <Tab
              eventKey="revision"
              title={
                <>
                  Requieren Revisión{' '}
                  <Badge bg="danger" pill>
                    {
                      asignaciones.filter(
                        (res) =>
                          res.ESTADO_CONFIRMACION_DOCENTE ===
                          'REQUIERE_REVISION'
                      ).length
                    }
                  </Badge>
                </>
              }
            >
              <Card>
                <Card.Body>
                  {renderTablaReservas(
                    asignaciones.filter(
                      (res) =>
                        res.ESTADO_CONFIRMACION_DOCENTE === 'REQUIERE_REVISION'
                    ),
                    true
                  )}
                </Card.Body>
              </Card>
            </Tab>
          )}

          {esDocente && (
            <Tab
              eventKey="pendientes"
              title={
                <>
                  Pendientes de Confirmación{' '}
                  <Badge bg="warning" pill>
                    {
                      asignaciones.filter(
                        (res) => res.ESTADO_CONFIRMACION_DOCENTE === 'PENDIENTE'
                      ).length
                    }
                  </Badge>
                </>
              }
            >
              <Card>
                <Card.Body>
                  <Table
                    striped
                    bordered
                    hover
                    responsive
                    size="sm"
                    className="mt-3"
                  >
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
                      {asignaciones
                        .filter(
                          (res) =>
                            res.ESTADO_CONFIRMACION_DOCENTE === 'PENDIENTE'
                        )
                        .map((res) => (
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
                            <td>
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
                  {asignaciones.filter(
                    (res) => res.ESTADO_CONFIRMACION_DOCENTE === 'PENDIENTE'
                  ).length === 0 && (
                    <Alert variant="light" className="text-center">
                      No tienes reservas pendientes de confirmación.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          )}
        </Tabs>
      </div>

      {/* Modal de EDICIÓN (para admins/coordinadores) */}
      {currentReservaToEdit && (
        <Modal
          show={showEditModal}
          onHide={handleCloseEditModal}
          size="lg"
          backdrop="static"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Editar Reserva #{currentReservaToEdit.ID_RESERVA}
            </Modal.Title>
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
              key={currentReservaToEdit.ID_RESERVA}
              initialData={currentReservaToEdit}
              onSubmit={handleUpdateReserva}
              onCancel={handleCloseEditModal}
              isLoadingExternally={loadingEditModal}
              submitButtonText="Guardar Cambios"
              isEditMode={true}
            />
          </Modal.Body>
        </Modal>
      )}

      {/* Modal de REVISIÓN (para docentes) */}
      {selectedReserva && (
        <Modal
          show={showRevisarModal}
          onHide={handleCloseRevisarModal}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Revisar Reserva: {selectedReserva.NOMBRE_EXAMEN}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5>Detalles de la Reserva</h5>
            <p>
              <strong>Asignatura:</strong> {selectedReserva.NOMBRE_ASIGNATURA}
            </p>
            <p>
              <strong>Fecha:</strong>{' '}
              {new Date(selectedReserva.FECHA_RESERVA).toLocaleDateString(
                'es-CL'
              )}{' '}
              | <strong>Horario:</strong> {selectedReserva.HORA_INICIO} -{' '}
              {selectedReserva.HORA_FIN}
            </p>
            <p>
              <strong>Sala:</strong> {selectedReserva.NOMBRE_SALA} (
              {selectedReserva.NOMBRE_EDIFICIO})
            </p>
            <hr />
            <Form.Group className="mb-3">
              <Form.Label>Observaciones (opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: La sala no cuenta con proyector, se necesita otra."
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
                  checked={nuevoEstadoConfirmacion === 'CONFIRMADO'}
                  onChange={(e) => setNuevoEstadoConfirmacion(e.target.value)}
                />
                <Form.Check
                  type="radio"
                  label="Requiere Revisión (dejar observaciones)"
                  name="estadoConfirmacion"
                  value="REQUIERE_REVISION"
                  checked={nuevoEstadoConfirmacion === 'REQUIERE_REVISION'}
                  onChange={(e) => setNuevoEstadoConfirmacion(e.target.value)}
                />
              </div>
            </Form.Group>
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
      )}
    </Layout>
  );
};

export default MisReservasAsignadasPage;
