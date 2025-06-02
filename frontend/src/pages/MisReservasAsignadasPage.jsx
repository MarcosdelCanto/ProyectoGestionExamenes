// src/pages/MisReservasAsignadasPage.jsx (NUEVO ARCHIVO)
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout'; // Ajusta la ruta
import { fetchMisAsignacionesDeReservas } from '../services/reservaService'; // Ajusta la ruta
import { Table, Spinner, Alert } from 'react-bootstrap';

const MisReservasAsignadasPage = () => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
              {asignaciones.map((res) => (
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
      </div>
    </Layout>
  );
};

export default MisReservasAsignadasPage;
