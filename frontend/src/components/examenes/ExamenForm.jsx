import { useState, useEffect } from 'react';
import { fetchAllSecciones } from '../../services/seccionService'; // Importar servicio
import { fetchAllEstados } from '../../services/estadoService'; // Importar servicio

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
      try {
        const [seccionesRes, estadosRes] = await Promise.all([
          fetchAllSecciones(), // Usar servicio
          fetchAllEstados(), // Usar servicio
        ]);

        if (Array.isArray(seccionesRes)) {
          setSecciones(seccionesRes);
        } else {
          // console.error(
          //   'Error: La API de secciones no devolvió un array:',
          //   seccionesRes
          // );
          setSecciones([]);
        }

        if (Array.isArray(estadosRes)) {
          setEstados(estadosRes);
        } else {
          // console.error(
          //   'Error: La API de estados no devolvió un array:',
          //   estadosRes
          // );
          setEstados([]);
        }
      } catch (error) {
        // console.error(
        //   'Error al cargar datos (error de red o parseo JSON):',
        //   error
        // );
        setSecciones([]); // Fallback a array vacío en caso de error crítico
        setEstados([]); // Fallback a array vacío en caso de error crítico
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
