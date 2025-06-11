import { useState, useEffect } from 'react';
// Asumimos que tienes estos servicios y funciones
import { fetchAllAsignaturas } from '../../services/asignaturaService';
import { fetchAllJornadas } from '../../services/jornadaService';
function SeccionForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_SECCION || '');
  const [asignaturaId, setAsignaturaId] = useState(
    initial?.ASIGNATURA_ID_ASIGNATURA?.toString() || ''
  );
  const [jornadaId, setJornadaId] = useState(
    initial?.JORNADA_ID_JORNADA?.toString() || ''
  );
  const [asignatura, setAsignatura] = useState([]);
  const [jornada, setJornada] = useState([]);

  useEffect(() => {
    // console.log('SeccionForm - Initial data:', initial); // Para depurar qué llega en 'initial'
    if (initial) {
      setNombre(initial.NOMBRE_SECCION || '');
      setAsignaturaId(initial.ASIGNATURA_ID_ASIGNATURA?.toString() || '');

      // Lógica para establecer jornadaId
      if (initial.JORNADA_ID_JORNADA) {
        setJornadaId(initial.JORNADA_ID_JORNADA.toString());
      } else if (initial.NOMBRE_JORNADA && jornada.length > 0) {
        // Fallback: Si no hay ID_JORNADA, pero sí NOMBRE_JORNADA y la lista de jornadas está cargada
        const jornadaEncontrada = jornada.find(
          (j) => j.NOMBRE_JORNADA === initial.NOMBRE_JORNADA
        );
        if (jornadaEncontrada) {
          setJornadaId(jornadaEncontrada.ID_JORNADA.toString());
          // console.log(`SeccionForm: Jornada ID encontrada por nombre '${initial.NOMBRE_JORNADA}': ${jornadaEncontrada.ID_JORNADA}`);
        }
        // } else { // Comentado para evitar reset si initial.JORNADA_ID_JORNADA ya estaba seteado
        //   setJornadaId(''); // No se encontró por nombre
        // }
      } else {
        setJornadaId(''); // No hay ID ni nombre, o la lista de jornadas aún no está lista
      }
    } else {
      setNombre('');
      setAsignaturaId('');
      setJornadaId('');
    }
  }, [initial, jornada]); // Añadir 'jornada' (lista de todas las jornadas) como dependencia

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [asignaturasRes, jornadasRes] = await Promise.all([
          fetchAllAsignaturas(), // Usar servicio
          fetchAllJornadas(), // Usar servicio
        ]);
        if (Array.isArray(asignaturasRes)) {
          setAsignatura(asignaturasRes);
        } else {
          // console.error(
          //   'Error: La API de asignaturas no devolvió un array:',
          //   asignaturasRes
          // );
          setAsignatura([]);
        }
        if (Array.isArray(jornadasRes)) {
          setJornada(jornadasRes);
        } else {
          // console.error(
          //   'Error: La API de jornadas no devolvió un array:',
          //   jornadasRes
          // );
          setJornada([]);
        }
      } catch (error) {
        // console.error('Error al obtener datos:', error);
        setAsignatura([]);
        setJornada([]);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_seccion: nombre,
      asignatura_id_asignatura: parseInt(asignaturaId),
      jornada_id_jornada: parseInt(jornadaId),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="nombre" className="form-label">
          Nombre de la Sección
        </label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Asignatura</label>
        <select
          className="form-control"
          value={asignaturaId}
          onChange={(e) => setAsignaturaId(e.target.value)}
          required
        >
          <option value="" key="default">
            Seleccione una asignatura
          </option>
          {asignatura.map((asignatura) => (
            <option
              key={`asignatura-${asignatura.ID_ASIGNATURA}`}
              value={asignatura.ID_ASIGNATURA}
            >
              {asignatura.NOMBRE_ASIGNATURA}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Jornada</label>
        <select
          className="form-control"
          value={jornadaId}
          onChange={(e) => setJornadaId(e.target.value)}
          required
        >
          <option value="" key="default">
            Seleccione una jornada
          </option>
          {jornada.map((jornada) => (
            <option
              key={`jornada-${jornada.ID_JORNADA}`}
              value={jornada.ID_JORNADA}
            >
              {jornada.NOMBRE_JORNADA}
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

export default SeccionForm;
