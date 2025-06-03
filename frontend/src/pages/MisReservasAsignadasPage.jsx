// src/pages/MisReservasAsignadasPage.jsx (NUEVO ARCHIVO)
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout'; // Ajusta la ruta
import {
  fetchMisAsignacionesDeReservas, // Servicio para obtener las asignaciones
  updateReserva, // Servicio para actualizar una reserva (antes llamado actualizarReservaService en la importación)
} from '../services/reservaService'; // Ajusta la ruta
import { Table, Spinner, Alert, Button, Modal } from 'react-bootstrap';
import ReservaForm from '../components/reservas/ReservaForm'; // Importa el formulario reutilizable

const MisReservasAsignadasPage = () => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [selectedRevisionRowId, setSelectedRevisionRowId] = useState(null); // Ya no es necesario

  const [showEditModal, setShowEditModal] = useState(false);
  const [currentReservaToEdit, setCurrentReservaToEdit] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);

  const cargarAsignaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMisAsignacionesDeReservas();
      setAsignaciones(data || []);
    } catch (err) {
      setError(
        'Error al cargar tus asignaciones de reservas. Intenta más tarde.'
      );
      setAsignaciones([]);
      console.error('Error cargando asignaciones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarAsignaciones();
  }, [cargarAsignaciones]);

  const handleOpenEditModal = (reservaId) => {
    const reserva = asignaciones.find((a) => a.ID_RESERVA === reservaId);
    if (reserva) {
      // Asegúrate de que 'reserva' tenga los campos necesarios para 'initialData' de ReservaForm
      // Específicamente ID_EXAMEN, ID_SALA, y MODULOS_IDS (array de números)
      // Aquí asumimos que tu backend los provee como ID_EXAMEN_FK, ID_SALA_FK, MODULOS_IDS_ARRAY
      // Adapta estos nombres de campo según tu estructura de datos real.
      setCurrentReservaToEdit({
        ID_RESERVA: reserva.ID_RESERVA,
        ID_EXAMEN: reserva.ID_EXAMEN, // Ejemplo: asegúrate que este ID exista en 'reserva'
        FECHA_RESERVA: reserva.FECHA_RESERVA,
        ID_SALA: reserva.ID_SALA, // Ejemplo: asegúrate que este ID exista en 'reserva'
        MODULOS_IDS: reserva.MODULOS_IDS_ARRAY || [], // Ejemplo: debe ser un array de IDs numéricos
      });
      setShowEditModal(true);
      setModalError(null);
      setModalSuccess(null);
    } else {
      setError('No se pudo encontrar la reserva para editar.');
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setCurrentReservaToEdit(null);
    setModalError(null);
    setModalSuccess(null);
  };

  const handleUpdateReserva = async (formDataPayload) => {
    if (!currentReservaToEdit?.ID_RESERVA) return;

    setLoadingModal(true);
    setModalError(null);
    setModalSuccess(null);
    try {
      // El payload ya está preparado por ReservaForm
      // Solo necesitas pasar el ID de la reserva que se está editando.
      await updateReserva(
        // Usar el nombre correcto de la función importada
        currentReservaToEdit.ID_RESERVA,
        formDataPayload
      );
      setModalSuccess('Reserva actualizada exitosamente.');
      cargarAsignaciones(); // Recarga la lista
      // Opcional: cerrar el modal después de un breve retraso para mostrar el mensaje de éxito
      setTimeout(() => handleCloseEditModal(), 1500);
    } catch (err) {
      setModalError(
        err.details || err.error || 'Error al actualizar la reserva.'
      );
    } finally {
      setLoadingModal(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-fluid mt-4 text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando tus reservas...</span>
          </Spinner>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid pt-4">
        <h2 className="display-6 mb-3">Mis Exámenes Programados</h2>
        <hr />
        {error && <Alert variant="danger">{error}</Alert>}

        {asignaciones.length === 0 && !loading && (
          <Alert variant="info">
            No tienes exámenes o reservas asignadas para mostrar.
          </Alert>
        )}

        {asignaciones.length > 0 && (
          <Table striped bordered hover responsive size="sm">
            <thead className="table-light sticky-top">
              <tr>
                <th>Examen</th>
                <th>Asignatura</th>
                <th>Sección</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Sala</th>
                <th>Estado Reserva</th>
                <th>Estado Examen</th>
                <th>Confirmación Docente</th>
              </tr>
            </thead>
            <tbody>
              {asignaciones
                .filter(
                  (res) =>
                    res.ESTADO_CONFIRMACION_DOCENTE !== 'REQUIERE_REVISION'
                )
                .map((res) => (
                  <tr key={res.ID_RESERVA}>
                    <td>{res.NOMBRE_EXAMEN}</td>
                    <td>{res.NOMBRE_ASIGNATURA}</td>
                    <td>{res.NOMBRE_SECCION}</td>
                    <td>
                      {new Date(res.FECHA_RESERVA).toLocaleDateString('es-CL')}
                    </td>
                    <td>
                      {res.HORA_INICIO} - {res.HORA_FIN}
                    </td>
                    <td>{res.NOMBRE_SALA}</td>
                    <td>{res.ESTADO_RESERVA}</td>
                    <td>{res.ESTADO_EXAMEN}</td>
                    <td>{res.ESTADO_CONFIRMACION_DOCENTE}</td>
                  </tr>
                ))}
            </tbody>
          </Table>
        )}

        <br />
        {asignaciones.length > 0 && (
          <>
            <h3 className="display-7 mb-3 mt-4">
              Exámenes que Requieren Revisión
            </h3>
            <hr />
            <Table striped bordered hover responsive size="sm">
              <thead className="table-light sticky-top">
                <tr>
                  <th>Examen</th>
                  <th>Asignatura</th>
                  <th>Sección</th>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Sala</th>
                  <th>Estado Reserva</th>
                  <th>Estado Examen</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {asignaciones
                  .filter(
                    (res) =>
                      res.ESTADO_CONFIRMACION_DOCENTE === 'REQUIERE_REVISION'
                  )
                  .map((res) => (
                    <tr key={`${res.ID_RESERVA}-revision`}>
                      <td>{res.NOMBRE_EXAMEN}</td>
                      <td>{res.NOMBRE_ASIGNATURA}</td>
                      <td>{res.NOMBRE_SECCION}</td>
                      <td>
                        {new Date(res.FECHA_RESERVA).toLocaleDateString(
                          'es-CL'
                        )}
                      </td>
                      <td>
                        {res.HORA_INICIO} - {res.HORA_FIN}
                      </td>
                      <td>{res.NOMBRE_SALA}</td>
                      <td>{res.ESTADO_RESERVA}</td>
                      <td>{res.ESTADO_EXAMEN}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenEditModal(res.ID_RESERVA)}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </>
        )}
      </div>

      {currentReservaToEdit && (
        <Modal
          show={showEditModal}
          onHide={handleCloseEditModal}
          size="lg"
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>Editar Reserva</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && (
              <Alert
                variant="danger"
                onClose={() => setModalError(null)}
                dismissible
              >
                {modalError}
              </Alert>
            )}
            {modalSuccess && (
              <Alert
                variant="success"
                onClose={() => setModalSuccess(null)}
                dismissible
              >
                {modalSuccess}
              </Alert>
            )}
            <ReservaForm
              initialData={currentReservaToEdit}
              onSubmit={handleUpdateReserva}
              onCancel={handleCloseEditModal}
              isLoadingExternally={loadingModal}
              submitButtonText="Guardar Cambios"
              isEditMode={true}
            />
          </Modal.Body>
        </Modal>
      )}
    </Layout>
  );
};

export default MisReservasAsignadasPage;
