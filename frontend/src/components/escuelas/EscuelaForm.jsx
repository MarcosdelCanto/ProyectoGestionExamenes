import { useState, useEffect } from 'react';

function EscuelaForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_ESCUELA || '');
  const [sedeId, setSedeId] = useState(initial?.SEDE_ID_SEDE?.toString() || ''); // Asumiendo que la escuela tiene SEDE_ID_SEDE
  const [sedes, setSedes] = useState([]);

  useEffect(() => {
    if (initial) {
      setNombre(initial.NOMBRE_ESCUELA || '');
      setSedeId(initial.SEDE_ID_SEDE?.toString() || ''); // Usar SEDE_ID_SEDE
    } else {
      // Resetear para el modo "agregar"
      setNombre('');
      setSedeId('');
    }
  }, [initial]);

  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/sede');
        const data = await response.json();
        setSedes(data);
      } catch (error) {
        // console.error('Error al obtener las sedes:', error);
      }
    };
    fetchSedes();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_escuela: nombre,
      sede_id_sede: parseInt(sedeId),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label"> Nombre de la Escuela </label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Sede</label>
        <select
          className="form-select"
          value={sedeId}
          onChange={(e) => setSedeId(e.target.value)}
          required
        >
          <option value="" key="default">
            Seleccione una sede
          </option>
          {sedes.map((sede) => (
            <option key={`sede-${sede.ID_SEDE}`} value={sede.ID_SEDE}>
              {sede.NOMBRE_SEDE}
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

export default EscuelaForm;
