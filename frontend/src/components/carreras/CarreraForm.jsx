import { useState, useEffect } from 'react';

function CarreraForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_CARRERA || '');
  const [escuelaId, setEscuelaId] = useState(
    initial?.ESCUELA_ID_ESCUELA?.toString() || ''
  );
  const [escuelas, setEscuelas] = useState([]);

  useEffect(() => {
    const fetchEscuelas = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/escuela');
        const data = await response.json();
        setEscuelas(data);
      } catch (error) {
        console.error('Error al obtener las escuelas:', error);
      }
    };
    fetchEscuelas();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_carrera: nombre,
      escuela_id_escuela: parseInt(escuelaId),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Nombre de la Carrera</label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <label className="form-label">Escuela</label>
        <select
          className="form-select"
          value={escuelaId}
          onChange={(e) => setEscuelaId(e.target.value)}
          required
        >
          <option value="" key="default">
            Seleccione una Escuela
          </option>
          {escuelas.map((escuela) => (
            <option
              key={`escuela-${escuela.ID_ESCUELA}`}
              value={escuela.ID_ESCUELA}
            >
              {escuela.NOMBRE_ESCUELA}
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

export default CarreraForm;