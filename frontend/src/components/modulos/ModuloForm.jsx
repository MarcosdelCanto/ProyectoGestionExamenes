import React, { useState, useEffect } from 'react';

function ModuloForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_MODULO || '');
  const [inicio, setInicio] = useState(initial?.INICIO_MODULO || '');
  const [fin, setFin] = useState(initial?.FIN_MODULO || '');
  const [orden, setOrden] = useState(initial?.ORDEN || '');
  const [estadoId, setEstadoId] = useState(
    initial?.ESTADO_ID_ESTADO ? String(initial?.ESTADO_ID_ESTADO) : ''
  );
  const [estados, setEstados] = useState([]);
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/estado');
        const data = await response.json();
        setEstados(data);
      } catch (error) {
        console.error('Error al obtener los estados:', error);
      }
    };
    fetchEstados();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_modulo: nombre,
      inicio_modulo: inicio,
      fin_modulo: fin,
      orden: parseInt(orden),
      estado_id_estado: parseInt(estadoId),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Orden</label>
        <input
          type="number"
          className="form-control"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          min="1"
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Nombre</label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Inicio (HH:mm)</label>
        <input
          type="text"
          className="form-control"
          maxLength={5}
          placeholder="07:30"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          pattern="^\d{2}:\d{2}$"
          title="Formato HH:MM"
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Fin (HH:mm)</label>
        <input
          type="text"
          className="form-control"
          maxLength={5}
          placeholder="09:00"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
          pattern="^\d{2}:\d{2}$"
          title="Formato HH:MM"
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Estado</label>
        <select
          className="form-control"
          value={estadoId}
          onChange={(e) => setEstadoId(e.target.value)}
          required
        >
          <option value="" key="default">
            Seleccione un estado
          </option>
          {estados.map((estado) => (
            <option key={`estado-${estado.ID_ESTADO}`} value={estado.ID_ESTADO}>
              {estado.NOMBRE_ESTADO}
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

export default ModuloForm;
