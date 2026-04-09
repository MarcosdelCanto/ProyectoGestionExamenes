import { useState, useEffect } from 'react';
import Select from 'react-select';
import { fetchAllEdificios } from '../../services/edificioService';
import { duocSelectStyles } from '../../styles/duocSelectStyles';

function SalaForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_SALA || '');
  const [capacidad, setCapacidad] = useState(initial?.CAPACIDAD_SALA || '');
  const [edificioId, setEdificioId] = useState(
    initial?.EDIFICIO_ID_EDIFICIO?.toString() || ''
  );
  const [edificios, setEdificios] = useState([]);

  useEffect(() => {
    if (initial) {
      setNombre(initial.NOMBRE_SALA || '');
      setCapacidad(initial.CAPACIDAD_SALA || '');
      setEdificioId(initial.EDIFICIO_ID_EDIFICIO?.toString() || '');
    } else {
      // Resetear para el modo "agregar"
      setNombre('');
      setCapacidad('');
      setEdificioId('');
    }
  }, [initial]);

  useEffect(() => {
    const fetchEdificios = async () => {
      try {
        const data = await fetchAllEdificios(); // Usar servicio
        if (Array.isArray(data)) {
          setEdificios(data);
        } else {
          setEdificios([]);
        }
      } catch (error) {
        // console.error('Error al cargar edificios:', error);
        setEdificios([]);
      }
    };
    fetchEdificios();
  }, []);

  const edificiosOptions = edificios.map((e) => ({
    value: e.ID_EDIFICIO.toString(),
    label: `${e.SIGLA_EDIFICIO} - ${e.NOMBRE_EDIFICIO}`,
  }));
  const selectedEdificio =
    edificiosOptions.find((o) => o.value === edificioId) || null;

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
        <Select
          options={edificiosOptions}
          value={selectedEdificio}
          onChange={(opt) => setEdificioId(opt ? opt.value : '')}
          placeholder="Seleccione un edificio"
          styles={duocSelectStyles}
          menuPortalTarget={document.body}
        />
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
