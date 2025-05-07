import { useState, useEffect } from 'react';
function SeccionForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_SECCION || '');
  const [asignaturaId, setAsignaturaId] = useState(
    initial?.ASIGNATURA_ID_ASIGNATURA?.toString() || ''
  );
  const [asignatura, setAsignatura] = useState([]);

  useEffect(() => {
    const fetchAsignaturas = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/asignatura');
        const data = await response.json();
        setAsignatura(data);
      } catch (error) {
        console.error('Error al obtener las asignaturas:', error);
      }
    };

    fetchAsignaturas();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_seccion: nombre,
      asignatura_id_asignatura: parseInt(asignaturaId),
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
