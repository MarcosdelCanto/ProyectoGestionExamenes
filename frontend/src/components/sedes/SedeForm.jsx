import { useState, useEffect } from 'react';

function SedeForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_SEDE || '');
  // const [direccion, setDireccion] = useState(initial?.DIRECCION_SEDE || ''); // Si tienes dirección

  useEffect(() => {
    if (initial) {
      setNombre(initial.NOMBRE_SEDE || '');
      // setDireccion(initial.DIRECCION_SEDE || ''); // Si tienes dirección
    } else {
      setNombre('');
      // setDireccion(''); // Si tienes dirección
    }
  }, [initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_sede: nombre,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="nombre" className="form-label">
          Nombre de la Sede
        </label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
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

export default SedeForm;
