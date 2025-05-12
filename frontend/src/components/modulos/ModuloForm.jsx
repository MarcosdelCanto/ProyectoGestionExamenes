import React, { useState } from 'react';

export default function ModuloForm({ initial = {}, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(
    initial.nombre_modulo ?? initial.NOMBRE_MODULO ?? ''
  );
  const [inicio, setInicio] = useState(
    initial.inicio_modulo ?? initial.INICIO_MODULO ?? ''
  );
  const [fin, setFin] = useState(
    initial.fin_modulo ?? initial.FIN_MODULO ?? ''
  );
  const [orden, setOrden] = useState(initial.orden ?? initial.ORDEN ?? '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_modulo: nombre,
      inicio_modulo: inicio,
      fin_modulo: fin,
      orden: Number(orden),
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
          min={1}
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
