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
      if (checked) {
        // Añadir si no está presente
        return {
          ...prev,
          modulosIds: [...new Set([...currentModulosIds, moduloId])],
        };
      } else {
        // Remover
        return {
          ...prev,
          modulosIds: currentModulosIds.filter((id) => id !== moduloId),
        };
      }
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

    const payload = {
      // Inicializar payload con campos que no son IDs problemáticos
      fecha_reserva: formData.fechaReserva,
      modulos: formData.modulosIds, // <--- CAMBIO DE NOMBRE AQUÍ de modulos_ids a modulos
    };

    // Manejo de examenId
    if (isEditMode) {
      // En modo edición, el examenId viene de initialData y está deshabilitado.
      // Usamos initialData.ID_EXAMEN directamente.
      // El error NJS-105 indica que el backend espera un número.
      if (initialData && initialData.ID_EXAMEN != null) {
        // No es null ni undefined
        const idExamenNum = Number(initialData.ID_EXAMEN);

        if (!isNaN(idExamenNum)) {
          payload.examen_id_examen = idExamenNum;
        } else {
          // initialData.ID_EXAMEN no es null pero no se pudo convertir a número válido
          setError(
            `El ID de examen original (${initialData.ID_EXAMEN}) es inválido.`
          );
          return;
        }
      } else {
        // initialData.ID_EXAMEN es null o undefined.
        // Si el backend requiere un número aquí, esto es un problema de datos o lógica.
        setError(
          'El ID de examen original es requerido para la edición y no fue proporcionado o es inválido.'
        );
        return;
      }
    } else {
      // Modo creación
      const idExamenNum = parseInt(formData.examenId, 10);

      if (!isNaN(idExamenNum)) {
        payload.examen_id_examen = idExamenNum;
      } else {
        // Esta validación ya debería estar cubierta por las validaciones de campos requeridos.
        setError('Debe seleccionar un examen válido.');
        return;
      }
    }

    // Manejo de salaId (siempre editable y requerido)
    const idSalaNum = parseInt(formData.salaId, 10);

    if (!isNaN(idSalaNum)) {
      payload.sala_id_sala = idSalaNum;
    } else {
      // Esta validación ya debería estar cubierta.
      setError('Debe seleccionar una sala válida.');
      return;
    }

    onSubmit(payload); // El padre maneja si es create o update
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
