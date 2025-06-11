import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllEstados } from '../../services/estadoService'; // Importar el servicio

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
        const data = await fetchAllEstados(); // Usar la función del servicio
        if (Array.isArray(data)) {
          setEstados(data);
        } else {
          // console.error('Error: La API de estados no devolvió un array:', data);
          setEstados([]); // Set to empty array if data is not an array
        }
      } catch (error) {
        // El error ya se maneja y loguea en fetchAllEstados
        // console.error('Error al obtener los estados:', error);
        setEstados([]); // Set to empty array on network or other fetch errors
      }
    };
    fetchEstados();
  }, []);

  // Filtrar los estados para mostrar solo ACTIVO (ID 1) e INACTIVO (ID 7)
  const estadosFiltradosParaForm = useMemo(() => {
    return estados.filter(
      (estado) => estado.ID_ESTADO === 1 || estado.ID_ESTADO === 7
    );
  }, [estados]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // console.log('ModuloForm: Enviando datos:', { nombre, inicio, fin, orden, estadoId });
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
          {estadosFiltradosParaForm.map((estado) => (
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
