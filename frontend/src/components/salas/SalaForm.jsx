import { useState, useEffect } from 'react';

function SalaForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_SALA || '');
  const [capacidad, setCapacidad] = useState(initial?.CAPACIDAD_SALA || '');
  const [edificioId, setEdificioId] = useState(
    initial?.EDIFICIO_ID_EDIFICIO?.toString() || ''
  );
  const [edificios, setEdificios] = useState([]);

  useEffect(() => {
    const fetchEdificios = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/edificio');
        const data = await response.json();
        setEdificios(data);
      } catch (error) {
        console.error('Error al cargar edificios:', error);
      }
    };
    fetchEdificios();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_sala: nombre,
      capacidad_sala: parseInt(capacidad),
      edificio_id_edificio: parseInt(edificioId),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Nombre de la Sala</label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Capacidad</label>
        <input
          type="number"
          className="form-control"
          value={capacidad}
          onChange={(e) => setCapacidad(e.target.value)}
          min="1"
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Edificio</label>
        <select
          className="form-select"
          value={edificioId}
          onChange={(e) => setEdificioId(e.target.value)}
          required
        >
          <option value="" key="default">
            Seleccione un edificio
          </option>
          {edificios.map((edificio) => (
            <option
              key={`edificio-${edificio.ID_EDIFICIO}`}
              value={edificio.ID_EDIFICIO}
            >
              {edificio.SIGLA_EDIFICIO} - {edificio.NOMBRE_EDIFICIO}
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

export default SalaForm;