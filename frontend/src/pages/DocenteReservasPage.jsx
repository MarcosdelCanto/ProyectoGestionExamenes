// src/pages/DocenteReservasPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout'; // Tu componente Layout principal
import {
  getMisReservasPendientesDocente,
  actualizarConfirmacionReservaDocente,
} from '../services/reservaService'; // Ajusta la ruta si es necesario
import { Modal, Button, Form, Table, Spinner, Alert } from 'react-bootstrap'; // Usaremos react-bootstrap para el modal y tabla

const DocenteReservasPage = () => {
  const [reservasPendientes, setReservasPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [nuevoEstadoConfirmacion, setNuevoEstadoConfirmacion] =
    useState('CONFIRMADO'); // Por defecto 'CONFIRMADO'

  const cargarReservas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMisReservasPendientesDocente();
      setReservasPendientes(data || []);
    } catch (err) {
      setError('Error al cargar las reservas pendientes. Intente más tarde.');
      setReservasPendientes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarReservas();
  }, [cargarReservas]);

  const handleOpenModal = (reserva) => {
    setSelectedReserva(reserva);
    setObservaciones(reserva.OBSERVACIONES_DOCENTE || ''); // Precargar observaciones si existen
    setNuevoEstadoConfirmacion(
      reserva.ESTADO_CONFIRMACION_DOCENTE === 'REQUIERE_REVISION'
        ? 'REQUIERE_REVISION'
        : 'CONFIRMADO'
    );
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReserva(null);
    setObservaciones('');
    setNuevoEstadoConfirmacion('CONFIRMADO');
  };

  const handleSubmitConfirmacion = async () => {
    if (!selectedReserva) return;
    setLoading(true); // Reutilizamos el loading general para la acción
    try {
      await actualizarConfirmacionReservaDocente(selectedReserva.ID_RESERVA, {
        nuevoEstado: nuevoEstadoConfirmacion,
        observaciones: observaciones,
      });
      alert('Reserva actualizada correctamente.');
      handleCloseModal();
      cargarReservas(); // Recargar la lista
    } catch (err) {
      alert(
        'Error al actualizar la reserva. Verifique los datos o intente más tarde.'
      );
      setError('Error al actualizar la reserva.'); // Podrías mostrar este error en la UI
    } finally {
      setLoading(false);
    }
  };

  if (loading && reservasPendientes.length === 0) {
    // Mostrar spinner solo en la carga inicial
    return (
      <Layout>
        <div className="container-fluid mt-4 text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando reservas...</span>
          </Spinner>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid mt-4">
        <h2>Mis Reservas de Examen Pendientes de Confirmación</h2>
        <hr />
        {error && <Alert variant="danger">{error}</Alert>}

        {reservasPendientes.length === 0 && !loading && (
          <Alert variant="info">
            No tienes reservas pendientes de confirmación.
          </Alert>
        )}

        {reservasPendientes.length > 0 && (
          <Table striped bordered hover responsive size="sm">
            <thead>
              <tr>
                <th>Examen</th>
                <th>Asignatura</th>
                <th>Sección</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Sala</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservasPendientes.map((reserva) => (
                <tr key={reserva.ID_RESERVA}>
                  <td>{reserva.NOMBRE_EXAMEN}</td>
                  <td>{reserva.NOMBRE_ASIGNATURA}</td>
                  <td>{reserva.NOMBRE_SECCION}</td>
                  <td>
                    {new Date(reserva.FECHA_RESERVA).toLocaleDateString(
                      'es-CL'
                    )}
                  </td>
                  <td>
                    {reserva.HORA_INICIO} - {reserva.HORA_FIN}
                  </td>
                  <td>
                    {reserva.NOMBRE_SALA} ({reserva.NOMBRE_EDIFICIO} -
                    {reserva.NOMBRE_SEDE})
                  </td>
                  <td>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenModal(reserva)}
                    >
                      Revisar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* Modal para Confirmación/Observaciones */}
        {selectedReserva && (
          <Modal show={showModal} onHide={handleCloseModal} centered>
            <Modal.Header closeButton>
              <Modal.Title>
                Revisar Reserva: {selectedReserva.NOMBRE_EXAMEN}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h5>Detalles:</h5>
              <p>
                <strong>Asignatura:</strong> {selectedReserva.NOMBRE_ASIGNATURA}
              </p>
              <p>
                <strong>Sección:</strong> {selectedReserva.NOMBRE_SECCION}
              </p>
              <p>
                <strong>Fecha:</strong>
                {new Date(selectedReserva.FECHA_RESERVA).toLocaleDateString(
                  'es-CL'
                )}
              </p>
              <p>
                <strong>Horario:</strong> {selectedReserva.HORA_INICIO} -
                {selectedReserva.HORA_FIN}
              </p>
              <p>
                <strong>Sala:</strong> {selectedReserva.NOMBRE_SALA} (
                {selectedReserva.NOMBRE_EDIFICIO} -{selectedReserva.NOMBRE_SEDE}
                )
              </p>

              <Form.Group className="mb-3">
                <Form.Label>Observaciones (opcional):</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Acción:</Form.Label>
                <div>
                  <Form.Check
                    type="radio"
                    label="Confirmar Reserva"
                    name="estadoConfirmacion"
                    id="estado CONFIRMADO"
                    value=" CONFIRMADO"
                    checked={nuevoEstadoConfirmacion === ' CONFIRMADO'}
                    onChange={(e) => setNuevoEstadoConfirmacion(e.target.value)}
                  />
                  <Form.Check
                    type="radio"
                    label="Requiere Revisión (con observaciones)"
                    name="estadoConfirmacion"
                    id="estadoRequiereRevision"
                    value="REQUIERE_REVISION"
                    checked={nuevoEstadoConfirmacion === 'REQUIERE_REVISION'}
                    onChange={(e) => setNuevoEstadoConfirmacion(e.target.value)}
                  />
                </div>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitConfirmacion}
                disabled={loading}
              >
                {loading ? (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                ) : (
                  'Enviar Actualización'
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default DocenteReservasPage;
