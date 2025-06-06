import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { fetchAllExamenesForSelect } from '../../services/examenService';
import { fetchAllSalas } from '../../services/salaService';
import { fetchAllModulos } from '../../services/moduloService';

const ReservaForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  isLoadingExternally = false,
  submitButtonText = 'Guardar',
  isEditMode = false,
  onModulosChange,
}) => {
  const [formData, setFormData] = useState({
    examenId: '',
    fechaReserva: '',
    salaId: '',
    modulosIds: [],
  });

  const [examenes, setExamenes] = useState([]);
  const [salas, setSalas] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatosInicialesSelects = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const [examenesData, salasData, modulosData] = await Promise.all([
          fetchAllExamenesForSelect(),
          fetchAllSalas(),
          fetchAllModulos(),
        ]);
        setExamenes(examenesData || []);
        setSalas(salasData || []);
        setModulos(modulosData || []);
      } catch (err) {
        setError('Error al cargar datos para el formulario.');
        console.error('Error en cargarDatosInicialesSelects:', err);
      } finally {
        setLoadingData(false);
      }
    };
    cargarDatosInicialesSelects();
  }, []);

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        examenId: initialData.ID_EXAMEN?.toString() || '',
        fechaReserva: initialData.FECHA_RESERVA
          ? new Date(initialData.FECHA_RESERVA).toISOString().split('T')[0]
          : '',
        salaId: initialData.ID_SALA?.toString() || '',
        modulosIds: initialData.MODULOS_IDS || [], // Espera un array de números
      });
    } else {
      setFormData({
        examenId: '',
        fechaReserva: '',
        salaId: '',
        modulosIds: [],
      });
    }
  }, [initialData, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleModuloCheckboxChange = (e) => {
    const { value, checked } = e.target;
    const moduloId = Number(value);

    setFormData((prev) => {
      const currentModulosIds = prev.modulosIds || [];
      let newModulosIds;

      if (checked) {
        // Añadir si no está presente
        newModulosIds = [...new Set([...currentModulosIds, moduloId])];
      } else {
        // Remover
        newModulosIds = currentModulosIds.filter((id) => id !== moduloId);
      }

      // NUEVO: Llamar al callback cuando cambien los módulos
      if (onModulosChange) {
        console.log('Llamando onModulosChange desde ReservaForm:', {
          nuevaCantidad: newModulosIds.length,
          nuevosModulosIds: newModulosIds,
        });
        onModulosChange(newModulosIds.length, newModulosIds);
      }

      return {
        ...prev,
        modulosIds: newModulosIds,
      };
    });
  };

  const handleSubmitInternal = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.examenId && !isEditMode) {
      // Examen es requerido para crear
      setError('Debe seleccionar un examen.');
      return;
    }
    if (!formData.salaId) {
      setError('Debe seleccionar una sala.');
      return;
    }
    if (formData.modulosIds.length === 0) {
      setError('Debe seleccionar al menos un módulo.');
      return;
    }
    if (!formData.fechaReserva) {
      setError('Debe seleccionar una fecha de reserva.');
      return;
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    // Aplicar validación de fecha solo si la fecha ha cambiado o es una nueva reserva

    const fechaFormulario = new Date(formData.fechaReserva);
    const fechaInicial = initialData?.FECHA_RESERVA
      ? new Date(
          new Date(initialData.FECHA_RESERVA).toISOString().split('T')[0]
        )
      : null;

    if (
      fechaFormulario < hoy &&
      (!isEditMode ||
        (isEditMode && fechaFormulario.getTime() !== fechaInicial?.getTime()))
    ) {
      setError('La fecha de reserva no puede ser anterior a la fecha actual.');
      return;
    }

    // CORREGIR: Usar los nombres que espera el backend
    const payload = {
      modulos: formData.modulosIds,
      fecha_reserva: formData.fechaReserva,
      sala_id_sala: parseInt(formData.salaId, 10),
      examen_id_examen: isEditMode
        ? Number(initialData.ID_EXAMEN)
        : parseInt(formData.examenId, 10),
    };

    onSubmit(payload);
  };

  if (loadingData) {
    return (
      <div className="text-center">
        <Spinner animation="border" /> <p>Cargando datos del formulario...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      <Form onSubmit={handleSubmitInternal}>
        <Row className="mb-3">
          <Form.Group as={Col} md="12" controlId="formExamenIdModal">
            {' '}
            {/* ID único para modal */}
            <Form.Label>Examen</Form.Label>
            <Form.Select
              name="examenId"
              value={formData.examenId}
              onChange={handleChange}
              required
              disabled={isEditMode} // Generalmente no se edita el examen de una reserva existente
            >
              <option value="">Seleccione un examen...</option>
              {examenes.map((ex) => (
                <option key={ex.ID_EXAMEN} value={ex.ID_EXAMEN}>
                  {ex.NOMBRE_EXAMEN}
                  {ex.NOMBRE_SECCION ? ` (Sección: ${ex.NOMBRE_SECCION})` : ''}
                  {ex.NOMBRE_ASIGNATURA && !ex.NOMBRE_SECCION
                    ? ` (Asignatura: ${ex.NOMBRE_ASIGNATURA})`
                    : ''}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group as={Col} md="6" controlId="formFechaReservaModal">
            {' '}
            {/* ID único */}
            <Form.Label>Fecha de Reserva</Form.Label>
            <Form.Control
              type="date"
              name="fechaReserva"
              value={formData.fechaReserva}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group as={Col} md="6" controlId="formSalaModal">
            {' '}
            {/* ID único */}
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
        </Row>

        <Form.Group className="mb-3" controlId="formModulosModal">
          {' '}
          <Form.Label>Módulos</Form.Label>
          <div
            className="modulos-checkbox-group"
            style={{
              maxHeight: '150px',
              overflowY: 'auto',
              border: '1px solid #ced4da',
              padding: '10px',
              borderRadius: '.25rem',
            }}
          >
            {modulos.map((m) => (
              <Form.Check
                type="checkbox"
                key={m.ID_MODULO}
                id={`modulo-${m.ID_MODULO}`} // ID único para el label
                label={`${m.NOMBRE_MODULO} (${m.INICIO_MODULO} - ${m.FIN_MODULO})`}
                value={m.ID_MODULO}
                checked={formData.modulosIds.includes(m.ID_MODULO)}
                onChange={handleModuloCheckboxChange}
              />
            ))}
            {modulos.length === 0 && (
              <p className="text-muted">No hay módulos disponibles.</p>
            )}
          </div>
          <Form.Text>
            Seleccionados: {formData.modulosIds.length} módulo(s).
            {formData.modulosIds.length === 0 && (
              <span className="text-danger">
                {' '}
                (Debe seleccionar al menos uno)
              </span>
            )}
          </Form.Text>
        </Form.Group>

        <div className="d-flex justify-content-end mt-3">
          {onCancel && (
            <Button
              variant="secondary"
              onClick={onCancel}
              className="me-2"
              disabled={isLoadingExternally}
            >
              Cancelar
            </Button>
          )}
          <Button
            variant="primary"
            type="submit"
            disabled={isLoadingExternally || loadingData}
          >
            {isLoadingExternally ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />{' '}
                Guardando...
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </div>
      </Form>
    </>
  );
};

export default ReservaForm;
