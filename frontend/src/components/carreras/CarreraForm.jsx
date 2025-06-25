import React, { useState, useEffect } from 'react';
import { fetchAllEscuelas } from '../../services/escuelaService'; // Importa el servicio de escuelas

function CarreraForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_CARRERA || '');
  const [escuelaId, setEscuelaId] = useState(
    initial?.ESCUELA_ID_ESCUELA?.toString() || ''
  );
  const [escuelas, setEscuelas] = useState([]);
  const [loadingEscuelas, setLoadingEscuelas] = useState(true); // Nuevo estado de carga
  const [errorEscuelas, setErrorEscuelas] = useState(''); // Nuevo estado de error

  // Efecto para inicializar el formulario cuando 'initial' cambia (para editar)
  useEffect(() => {
    if (initial) {
      setNombre(initial.NOMBRE_CARRERA || '');
      setEscuelaId(initial.ESCUELA_ID_ESCUELA?.toString() || '');
    } else {
      // Resetear para el modo "agregar" (cuando initial es nulo)
      setNombre('');
      setEscuelaId('');
    }
  }, [initial]);

  // Efecto para cargar las escuelas cuando el componente se monta
  useEffect(() => {
    const fetchEscuelas = async () => {
      setLoadingEscuelas(true); // Inicia la carga
      setErrorEscuelas(''); // Limpia errores anteriores
      try {
        const data = await fetchAllEscuelas(); // ¡Uso de la función del servicio!
        setEscuelas(data);
      } catch (error) {
        console.error('Error al obtener las escuelas:', error);
        setErrorEscuelas(
          'No se pudieron cargar las escuelas. Por favor, intente de nuevo.'
        );
      } finally {
        setLoadingEscuelas(false); // Finaliza la carga
      }
    };
    fetchEscuelas();
  }, []); // Se ejecuta solo una vez al montar

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
        <label className="form-label mt-3">Escuela</label>
        {/* Añadido mt-3 para espacio */}
        <select
          className="form-select"
          value={escuelaId}
          onChange={(e) => setEscuelaId(e.target.value)}
          required
          disabled={loadingEscuelas} // Deshabilita el selector mientras carga
        >
          <option value="" key="default">
            {loadingEscuelas
              ? 'Cargando escuelas...'
              : 'Seleccione una Escuela'}
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
        {errorEscuelas && (
          <div className="alert alert-danger mt-2" role="alert">
            {errorEscuelas}
          </div>
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

export default CarreraForm;
