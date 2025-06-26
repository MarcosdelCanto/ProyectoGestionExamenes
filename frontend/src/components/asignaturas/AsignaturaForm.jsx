import { useState, useEffect } from 'react';
import { fetchAllCarreras } from '../../services/carreraService'; // Importar servicio

function AsignaturaForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_ASIGNATURA || '');
  const [carreraId, setCarreraId] = useState(
    initial?.CARRERA_ID_CARRERA?.toString() || ''
  );
  const [carrera, setCarrera] = useState([]);
  const [loadingCarreras, setLoadingCarreras] = useState(true); // Estado de carga
  const [errorCarreras, setErrorCarreras] = useState(''); // Estado

  useEffect(() => {
    if (initial) {
      setNombre(initial.NOMBRE_ASIGNATURA || '');
      setCarreraId(initial.CARRERA_ID_CARRERA?.toString() || '');
    } else {
      setNombre('');
      setCarreraId('');
    }
  }, [initial]);

  useEffect(() => {
    const fetchCarreras = async () => {
      setLoadingCarreras(true); // Inicia la carga
      setErrorCarreras(''); // Limpia errores anteriores
      try {
        const data = await fetchAllCarreras();
        setCarrera(data);
      } catch (error) {
        console.error('Error al obtener las carreras:', error);
        setErrorCarreras('Error al cargar las carreras');
      } finally {
        setLoadingCarreras(false); // Finaliza la carga
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
          className="form-select"
          value={carreraId}
          onChange={(e) => setCarreraId(e.target.value)}
          required
          disabled={loadingCarreras}
        >
          <option value="" key="default">
            {loadingCarreras
              ? 'Cargando carreras...'
              : 'Seleccione una carreras'}
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
        {errorCarreras && (
          <div className="alert alert-danger mt-2">{errorCarreras}</div>
        )}
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
