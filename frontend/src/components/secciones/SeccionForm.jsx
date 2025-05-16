import { useState, useEffect } from 'react';
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
    const fetchData = async () => {
      try {
        const [asignaturasRes, jornadasRes] = await Promise.all([
          fetch('http://localhost:3000/api/asignatura'),
          fetch('http://localhost:3000/api/jornada'),
        ]);
        const asignaturasData = await asignaturasRes.json();
        const jornadasData = await jornadasRes.json();
        setAsignatura(asignaturasData);
        setJornada(jornadasData);
      } catch (error) {
        console.error('Error al obtener datos:', error);
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
