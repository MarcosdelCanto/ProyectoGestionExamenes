import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [seccionesRes, estadosRes] = await Promise.all([
          fetch('http://localhost:3000/api/seccion'),
          fetch('http://localhost:3000/api/estado'),
        ]);
        const seccionesData = await seccionesRes.json();
        const estadosData = await estadosRes.json();
        setSecciones(seccionesData);
        setEstados(estadosData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_examen: nombre,
      inscritos_examen: parseInt(inscritos),
      tipo_procesamiento_examen: tipoProcesamiento,
      plataforma_prose_examen: plataforma,
      situacion_evaluativa_examen: situacionEvaluativa,
      cantidad_modulos_examen: parseInt(cantidadModulos),
      seccion_id_seccion: parseInt(seccionId),
      estado_id_estado: parseInt(estadoId),
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
      <div className="mb-3">
        <label className="form-label">Inscritos</label>
        <input
          type="number"
          className="form-control"
          value={inscritos}
          onChange={(e) => setInscritos(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Tipo de Procesamiento</label>
        <input
          type="text"
          className="form-control"
          value={tipoProcesamiento}
          onChange={(e) => setTipoProcesamiento(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Plataforma</label>
        <input
          type="text"
          className="form-control"
          value={plataforma}
          onChange={(e) => setPlataforma(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Situación Evaluativa</label>
        <input
          type="text"
          className="form-control"
          value={situacionEvaluativa}
          onChange={(e) => setSituacionEvaluativa(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Cantidad de Módulos</label>
        <input
          type="number"
          className="form-control"
          value={cantidadModulos}
          onChange={(e) => setCantidadModulos(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Sección</label>
        <select
          className="form-select"
          value={seccionId}
          onChange={(e) => setSeccionId(e.target.value)}
          required
        >
          <option value="">Seleccione una sección</option>
          {secciones.map((seccion) => (
            <option
              key={`seccion-${seccion.ID_SECCION}`}
              value={seccion.ID_SECCION}
            >
              {seccion.NOMBRE_SECCION} - {seccion.NOMBRE_ASIGNATURA}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Estado</label>
        <select
          className="form-select"
          value={estadoId}
          onChange={(e) => setEstadoId(e.target.value)}
          required
        >
          <option value="">Seleccione un estado</option>
          {estados.map((estado) => (
            <option key={`estado-${estado.ID_ESTADO}`} value={estado.ID_ESTADO}>
              {estado.NOMBRE_ESTADO}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          Guardar
        </button>
      </div>
    </form>
  );
}

export default ExamenForm;
