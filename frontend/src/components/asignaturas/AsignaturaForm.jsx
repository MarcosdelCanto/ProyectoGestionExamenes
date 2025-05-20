import { useState, useEffect } from 'react';

function AsignaturaForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_ASIGNATURA || '');
  const [carreraId, setCarreraId] = useState(
    initial?.CARRERA_ID_CARRERA?.toString() || ''
  );
  const [carrera, setCarrera] = useState([]);
  console.log(carreraId);
  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/carrera');
        const data = await response.json();
        setCarrera(data);
      } catch (error) {
        console.error('Error al obtener las carreras:', error);
      }
    };
    fetchCarreras();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_asignatura: nombre,
      carrera_id_carrera: parseInt(carreraId),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="nombre" className="form-label">
          Nombre de la Asignatura
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
        <label className="form-label">Carrera</label>
        <select
          className="form-control"
          value={carreraId}
          onChange={(e) => setCarreraId(e.target.value)}
          required
        >
          <option value="" key="default">
            Seleccione una carrera
          </option>
          {carrera.map((carrera) => (
            <option
              key={`carrera-${carrera.ID_CARRERA}`}
              value={carrera.ID_CARRERA}
            >
              {carrera.NOMBRE_CARRERA}
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

export default AsignaturaForm;
