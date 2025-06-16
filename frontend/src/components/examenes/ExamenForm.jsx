import { useState, useEffect } from 'react';
import { fetchAllSecciones } from '../../services/seccionService'; // Importar servicio
import { fetchAllEstados } from '../../services/estadoService'; // Importar servicio
import Select from 'react-select'; // Importar react-select
import { Row, Col, Form } from 'react-bootstrap'; // Importar Row y Col

function ExamenForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_EXAMEN || '');
  const [inscritos, setInscritos] = useState(initial?.INSCRITOS_EXAMEN || '');
  const [tipoProcesamiento, setTipoProcesamiento] = useState(
    initial?.TIPO_PROCESAMIENTO_EXAMEN || ''
  );
  const [plataforma, setPlataforma] = useState(
    initial?.PLATAFORMA_PROSE_EXAMEN || ''
  );
  const [situacionEvaluativa, setSituacionEvaluativa] = useState(
    initial?.SITUACION_EVALUATIVA_EXAMEN || ''
  );
  const [cantidadModulos, setCantidadModulos] = useState(
    initial?.CANTIDAD_MODULOS_EXAMEN || ''
  );
  const [seccionId, setSeccionId] = useState(
    initial?.SECCION_ID_SECCION?.toString() || ''
  );
  const [estadoId, setEstadoId] = useState(
    initial?.ESTADO_ID_ESTADO?.toString() || ''
  );
  const [secciones, setSecciones] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loadingSecciones, setLoadingSecciones] = useState(false);
  const [loadingEstados, setLoadingEstados] = useState(false);
  const [formAttempted, setFormAttempted] = useState(false);

  // Helpers para react-select
  const toSelectOptions = (
    items,
    valueKey,
    labelKey,
    secondaryLabelKey = null
  ) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
      value: item[valueKey],
      label: secondaryLabelKey
        ? `${item[labelKey]} - ${item[secondaryLabelKey]}`
        : item[labelKey],
    }));
  };

  const seccionOptions = toSelectOptions(
    secciones,
    'ID_SECCION',
    'NOMBRE_SECCION',
    'NOMBRE_ASIGNATURA'
  );
  const estadoOptions = toSelectOptions(estados, 'ID_ESTADO', 'NOMBRE_ESTADO');

  const selectedSeccionOption =
    seccionOptions.find((option) => option.value?.toString() === seccionId) ||
    null;
  const selectedEstadoOption =
    estadoOptions.find((option) => option.value?.toString() === estadoId) ||
    null;

  // Efecto para actualizar el estado del formulario cuando 'initial' cambia (para el modo edición)
  useEffect(() => {
    if (initial) {
      setNombre(initial.NOMBRE_EXAMEN || '');
      setInscritos(initial.INSCRITOS_EXAMEN || '');
      setTipoProcesamiento(initial.TIPO_PROCESAMIENTO_EXAMEN || '');
      setPlataforma(initial.PLATAFORMA_PROSE_EXAMEN || '');
      setSituacionEvaluativa(initial.SITUACION_EVALUATIVA_EXAMEN || '');
      setCantidadModulos(initial.CANTIDAD_MODULOS_EXAMEN || '');

      // Manejar Sección
      if (initial.SECCION_ID_SECCION) {
        setSeccionId(initial.SECCION_ID_SECCION.toString());
      } else if (initial.NOMBRE_SECCION && secciones.length > 0) {
        // El NOMBRE_SECCION del examen parece ser el CODIGO_SECCION
        const seccionEncontrada = secciones.find(
          (s) => s.CODIGO_SECCION === initial.NOMBRE_SECCION
        );
        if (seccionEncontrada) {
          setSeccionId(seccionEncontrada.ID_SECCION.toString());
        } else {
          // Opcional: intentar buscar por NOMBRE_SECCION si la búsqueda por código falla
          const seccionPorNombrePuro = secciones.find(
            (s) => s.NOMBRE_SECCION === initial.NOMBRE_SECCION
          );
          setSeccionId(
            seccionPorNombrePuro
              ? seccionPorNombrePuro.ID_SECCION.toString()
              : ''
          );
        }
      } else {
        setSeccionId('');
      }

      // Manejar Estado
      if (initial.ESTADO_ID_ESTADO) {
        setEstadoId(initial.ESTADO_ID_ESTADO.toString());
      } else if (initial.NOMBRE_ESTADO && estados.length > 0) {
        const estadoEncontrado = estados.find(
          (e) => e.NOMBRE_ESTADO === initial.NOMBRE_ESTADO
        );
        if (estadoEncontrado) {
          setEstadoId(estadoEncontrado.ID_ESTADO.toString());
        } else {
          setEstadoId('');
        }
      } else {
        setEstadoId('');
      }
    } else {
      // Resetear para el modo "agregar"
      setNombre('');
      setInscritos('');
      setTipoProcesamiento('');
      setPlataforma('');
      setSituacionEvaluativa('');
      setCantidadModulos('');
      setSeccionId('');
      setEstadoId('');
    }
  }, [initial, secciones, estados]); // Añadir secciones y estados como dependencias

  useEffect(() => {
    const fetchData = async () => {
      setLoadingSecciones(true);
      setLoadingEstados(true);
      try {
        const seccionesRes = await fetchAllSecciones();
        if (Array.isArray(seccionesRes)) {
          setSecciones(seccionesRes);
        } else {
          setSecciones([]);
        }
      } catch (error) {
        console.error('Error al cargar secciones:', error);
        setSecciones([]);
      } finally {
        setLoadingSecciones(false);
      }

      try {
        const estadosRes = await fetchAllEstados();
        if (Array.isArray(estadosRes)) {
          setEstados(estadosRes);
        } else {
          setEstados([]);
        }
      } catch (error) {
        console.error('Error al cargar estados:', error);
        setEstados([]);
      } finally {
        setLoadingEstados(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormAttempted(true);

    if (!seccionId || !estadoId) {
      // Si alguno de los campos de react-select requeridos está vacío, no continuar.
      // Los mensajes de error visuales se mostrarán debido a formAttempted.
      return;
    }

    onSubmit({
      nombre_examen: nombre,
      inscritos_examen: inscritos ? parseInt(inscritos) : null,
      tipo_procesamiento_examen: tipoProcesamiento,
      plataforma_prose_examen: plataforma,
      situacion_evaluativa_examen: situacionEvaluativa,
      cantidad_modulos_examen: cantidadModulos
        ? parseInt(cantidadModulos)
        : null,
      seccion_id_seccion: seccionId ? parseInt(seccionId) : null,
      estado_id_estado: estadoId ? parseInt(estadoId) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Nombre del Examen</label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Inscritos</Form.Label>
            <Form.Control
              type="number"
              value={inscritos}
              onChange={(e) => setInscritos(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Tipo de Procesamiento</Form.Label>
            <Form.Control
              type="text"
              value={tipoProcesamiento}
              onChange={(e) => setTipoProcesamiento(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Plataforma</Form.Label>
            <Form.Control
              type="text"
              value={plataforma}
              onChange={(e) => setPlataforma(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Situación Evaluativa</Form.Label>
            <Form.Control
              type="text"
              value={situacionEvaluativa}
              onChange={(e) => setSituacionEvaluativa(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Cantidad de Módulos</Form.Label>
            <Form.Control
              type="number"
              value={cantidadModulos}
              onChange={(e) => setCantidadModulos(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Sección</Form.Label>
            <Select
              inputId="seccion-select"
              options={seccionOptions}
              value={selectedSeccionOption}
              onChange={(selected) =>
                setSeccionId(selected ? selected.value.toString() : '')
              }
              placeholder="Seleccione una sección"
              isLoading={loadingSecciones}
              isDisabled={loadingSecciones}
              isClearable
              noOptionsMessage={() => 'No hay secciones disponibles'}
            />
            {formAttempted && !seccionId && (
              <div className="invalid-feedback d-block">
                Seleccione una sección.
              </div>
            )}
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Estado</Form.Label>
            <Select
              inputId="estado-select"
              options={estadoOptions}
              value={selectedEstadoOption}
              onChange={(selected) =>
                setEstadoId(selected ? selected.value.toString() : '')
              }
              placeholder="Seleccione un estado"
              isLoading={loadingEstados}
              isDisabled={loadingEstados}
              isClearable
              noOptionsMessage={() => 'No hay estados disponibles'}
            />
            {formAttempted && !estadoId && (
              <div className="invalid-feedback d-block">
                Seleccione un estado.
              </div>
            )}
          </Form.Group>
        </Col>
      </Row>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loadingSecciones || loadingEstados}
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

export default ExamenForm;
