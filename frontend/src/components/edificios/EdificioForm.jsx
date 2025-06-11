import { useState, useEffect } from 'react';
import { fetchAllSedes } from '../../services/sedeService'; // Importar servicio

function EdificioForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_EDIFICIO || '');
  const [sigla, setSigla] = useState(initial?.SIGLA_EDIFICIO || '');
  const [sedeId, setSedeId] = useState(initial?.SEDE_ID_SEDE?.toString() || '');
  const [sedes, setSedes] = useState([]);

  useEffect(() => {
    if (initial) {
      setNombre(initial.NOMBRE_EDIFICIO || '');
      setSigla(initial.SIGLA_EDIFICIO || '');
      setSedeId(initial.SEDE_ID_SEDE?.toString() || '');
    } else {
      setNombre('');
      setSigla('');
      setSedeId('');
    }
  }, [initial]);

  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const data = await fetchAllSedes(); // Usar servicio
        if (Array.isArray(data)) {
          setSedes(data);
        } else {
          setSedes([]);
        }
      } catch (error) {
        // console.error('Error al obtener las sedes:', error);
        setSedes([]);
      }
    };
    fetchSedes();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_edificio: nombre,
      sigla_edificio: sigla,
      sede_id_sede: parseInt(sedeId),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="nombre" className="form-label">
          Nombre del Edificio
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
        <label htmlFor="sigla" className="form-label">
          Sigla del Edificio
        </label>
        <input
          type="text"
          className="form-control"
          value={sigla}
          onChange={(e) => setSigla(e.target.value)}
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
          <option value="">Seleccione una sede</option>
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

export default EdificioForm;
