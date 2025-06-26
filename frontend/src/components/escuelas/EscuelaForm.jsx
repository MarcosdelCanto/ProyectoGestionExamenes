// frontend/src/components/escuelas/EscuelaForm.jsx

import { useState, useEffect } from 'react';
import { fetchAllSedes } from '../../services/sedeService'; // Importar servicio

function EscuelaForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_ESCUELA || '');
  const [sedeId, setSedeId] = useState(initial?.SEDE_ID_SEDE?.toString() || '');
  // Colores por defecto: gris claro para fondo, gris oscuro para borde
  const [colorBackground, setColorBackground] = useState(
    initial?.COLOR_BACKGROUND || '#D3D3D3'
  );
  const [colorBorder, setColorBorder] = useState(
    initial?.COLOR_BORDER || '#A9A9A9'
  );
  const [sedes, setSedes] = useState([]);
  const [loadingSedes, setLoadingSedes] = useState(true);
  const [errorSedes, setErrorSedes] = useState('');

  useEffect(() => {
    if (initial) {
      setNombre(initial.NOMBRE_ESCUELA || '');
      setSedeId(initial.SEDE_ID_SEDE?.toString() || '');
      // Si hay colores iniciales, usarlos; de lo contrario, mantener los actuales (que pueden ser por defecto o ya seleccionados)
      setColorBackground(initial.COLOR_BACKGROUND || '#D3D3D3');
      setColorBorder(initial.COLOR_BORDER || '#A9A9A9');
    } else {
      // Al crear una nueva escuela (no hay 'initial'), establecer los valores iniciales.
      setNombre('');
      setSedeId('');
      setColorBackground('#D3D3D3'); // Restablecer al gris claro por defecto para una nueva creación
      setColorBorder('#A9A9A9'); // Restablecer al gris oscuro por defecto para una nueva creación
    }
  }, [initial]);

  useEffect(() => {
    const fetchSedes = async () => {
      setLoadingSedes(true);
      setErrorSedes('');
      try {
        const data = await fetchAllSedes();
        setSedes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error al obtener las sedes:', error);
        setErrorSedes('Error al cargar las sedes');
      } finally {
        setLoadingSedes(false);
      }
    };
    fetchSedes();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_escuela: nombre,
      sede_id_sede: parseInt(sedeId),
      color_background: colorBackground, // Incluir color de fondo
      color_border: colorBorder, // Incluir color de borde
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Nombre de la Escuela</label>
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
          disabled={loadingSedes}
        >
          <option value="" key="default">
            {loadingSedes ? 'Cargando sedes...' : 'Seleccione una Sede'}
          </option>
          {sedes.map((sede) => (
            <option key={`sede-${sede.ID_SEDE}`} value={sede.ID_SEDE}>
              {sede.NOMBRE_SEDE}
            </option>
          ))}
        </select>
        {errorSedes && <div className="text-danger mt-2">{errorSedes}</div>}
      </div>
      <div className="mb-3">
        <label className="form-label">Color de Fondo</label>
        <input
          type="color"
          className="form-control form-control-color"
          value={colorBackground}
          onChange={(e) => setColorBackground(e.target.value)}
          title="Seleccione el color de fondo para la escuela"
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Color del Borde</label>
        <input
          type="color"
          className="form-control form-control-color"
          value={colorBorder}
          onChange={(e) => setColorBorder(e.target.value)}
          title="Seleccione el color del borde para la escuela"
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

export default EscuelaForm;
