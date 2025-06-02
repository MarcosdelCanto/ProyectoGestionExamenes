import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout'; // Ajusta la ruta a tu componente Layout
import { Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { crearReservaParaExamenExistenteService } from '../services/reservaService';
import { fetchAllExamenesForSelect } from '../services/examenService';
import { fetchAllSalas } from '../services/salaService';
import { fetchAllModulos } from '../services/moduloService';
// Ya no necesitamos fetchAllEstados aquí si el backend asigna el estado por defecto

const CrearReservaPage = () => {
  const [formData, setFormData] = useState({
    examenId: '',
    fechaReserva: '',
    salaId: '',
    modulosIds: [],
    // estadoReservaId: '', // <-- Eliminado: El backend lo asignará como 'PROGRAMADO'
  });

  const [examenes, setExamenes] = useState([]);
  const [salas, setSalas] = useState([]);
  const [modulos, setModulos] = useState([]);
  // const [estadosReserva, setEstadosReserva] = useState([]); // <-- Ya no es necesario

  const [loading, setLoading] = useState(false); // Para el submit del formulario
  const [loadingData, setLoadingData] = useState(true); // Para la carga inicial de selectores
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const [examenesData, salasData, modulosData] = await Promise.all([
          fetchAllExamenesForSelect(),
          fetchAllSalas(),
          fetchAllModulos(),
          // Ya no llamamos a fetchAllEstados aquí
        ]);

        setExamenes(examenesData || []);
        setSalas(salasData || []);
        setModulos(modulosData || []);
      } catch (err) {
        setError('Error al cargar datos iniciales para el formulario.');
        console.error('Error en cargarDatosIniciales:', err);
      } finally {
        setLoadingData(false);
      }
    };
    cargarDatosIniciales();
  }, []); // Se ejecuta solo una vez al montar el componente

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleModuloChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({
      ...prev,
      modulosIds: selectedOptions.map(Number),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.modulosIds.length === 0) {
      setError('Debe seleccionar al menos un módulo.');
      return;
    }
    // Validación simple de fecha (puedes mejorarla)
    if (!formData.fechaReserva) {
      setError('Debe seleccionar una fecha de reserva.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      examen_id_examen: parseInt(formData.examenId),
      fecha_reserva: formData.fechaReserva, // Formato YYYY-MM-DD
      sala_id_sala: parseInt(formData.salaId),
      modulos_ids: formData.modulosIds,
      // estado_id_estado_reserva ya no se envía, el backend lo pone como 'PROGRAMADO'
    };

    try {
      const response = await crearReservaParaExamenExistenteService(payload);
      setSuccess(
        response.message ||
          'Reserva creada y PROGRAMADO exitosamente, pendiente de confirmación docente.'
      );
      // Opcional: Resetear formulario
      setFormData({
        examenId: '',
        fechaReserva: '',
        salaId: '',
        modulosIds: [],
      });
    } catch (err) {
      setError(err.details || err.error || 'Error al crear la reserva.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Layout>
        <div className="container mt-4 text-center">
          <Spinner animation="border" /> <p>Cargando datos del formulario...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mt-4">
        <h2>Crear Reserva para Examen Existente</h2>
        <p className="text-muted">
          Las reservas creadas aquí quedarán en estado "PROGRAMADO" y pendientes
          de confirmación por el docente asignado.
        </p>
        <hr />
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Form.Group as={Col} md="12" controlId="formExamenId">
              <Form.Label>Examen a Reservar</Form.Label>
              <Form.Select
                name="examenId"
                value={formData.examenId}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un examen...</option>
                {examenes.map((ex) => (
                  <option key={ex.ID_EXAMEN} value={ex.ID_EXAMEN}>
                    {ex.NOMBRE_EXAMEN}
                    {ex.NOMBRE_SECCION
                      ? ` (Sección: ${ex.NOMBRE_SECCION})`
                      : ''}
                    {ex.NOMBRE_ASIGNATURA && !ex.NOMBRE_SECCION
                      ? ` (Asignatura: ${ex.NOMBRE_ASIGNATURA})`
                      : ''}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md="6" controlId="formFechaReserva">
              {/* Ajustado a md="6" */}
              <Form.Label>Fecha de Reserva</Form.Label>
              <Form.Control
                type="date"
                name="fechaReserva"
                value={formData.fechaReserva}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group as={Col} md="6" controlId="formSala">
              {/* Ajustado a md="6" */}
              <Form.Label>Sala</Form.Label>
              <Form.Select
                name="salaId"
                value={formData.salaId}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione una sala...</option>
                {salas.map((s) => (
                  <option key={s.ID_SALA} value={s.ID_SALA}>
                    {s.NOMBRE_SALA}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {/* El selector de Estado Inicial de la Reserva se ha eliminado */}
          </Row>

          <Form.Group className="mb-3" controlId="formModulos">
            <Form.Label>
              Módulos a Reservar (mantén presionado Ctrl/Cmd para seleccionar
              varios)
            </Form.Label>
            <Form.Select
              multiple
              name="modulosIds"
              value={formData.modulosIds.map(String)}
              onChange={handleModuloChange}
              required
              style={{ height: '150px' }}
            >
              {modulos.map((m) => (
                <option key={m.ID_MODULO} value={m.ID_MODULO}>
                  {m.NOMBRE_MODULO} ({m.INICIO_MODULO} - {m.FIN_MODULO})
                </option>
              ))}
            </Form.Select>
            <Form.Text>
              Seleccionados: {formData.modulosIds.length} módulo(s).
            </Form.Text>
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            disabled={loading || loadingData}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                Creando...
              </>
            ) : (
              'Crear Reserva'
            )}
          </Button>
        </Form>
      </div>
    </Layout>
  );
};

export default CrearReservaPage;
