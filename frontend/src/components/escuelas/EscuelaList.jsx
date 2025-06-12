import React from 'react';
import { Table } from 'react-bootstrap';

function EscuelaList({
  escuelas,
  selectedEscuelas, // Cambiado de selectedEscuela a selectedEscuelas (array)
  onToggleEscuelaSelection, // Nueva función para manejar la selección individual
  onToggleSelectAll, // Nueva función para seleccionar/deseleccionar todo
  loading,
}) {
  if (loading) {
    return <div>Cargando escuelas...</div>;
  }

  if (!escuelas || escuelas.length === 0) {
    return (
      <div className="alert alert-info text-center">
        No hay escuelas para mostrar.
      </div>
    );
  }

  return (
    <div className="table-responsive border mb-3">
      <table className="table table-hover table-bordered mb-0">
        <thead className="table-light">
          <tr>
            <th className="text-center align-middle">
              <input
                type="checkbox"
                className="form-check-input"
                checked={
                  escuelas.length > 0 &&
                  selectedEscuelas.length === escuelas.length
                }
                onChange={onToggleSelectAll}
                disabled={escuelas.length === 0}
                aria-label="Seleccionar todas las escuelas"
              />
            </th>
            <th className="align-middle">ID</th>
            <th className="align-middle">Nombre</th>
            {/* Agrega más encabezados si es necesario */}
          </tr>
        </thead>
        <tbody>
          {escuelas.map((e) => (
            <tr
              key={`escuela-${e.ID_ESCUELA}`}
              onClick={() => onToggleEscuelaSelection(e)}
              className={`align-middle ${
                selectedEscuelas.find((se) => se.ID_ESCUELA === e.ID_ESCUELA)
                  ? 'table-primary'
                  : ''
              }`}
              style={{ cursor: 'pointer' }}
            >
              <td className="text-center align-middle">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={
                    !!selectedEscuelas.find(
                      (se) => se.ID_ESCUELA === e.ID_ESCUELA
                    )
                  }
                  onChange={(event) => {
                    event.stopPropagation();
                    onToggleEscuelaSelection(e);
                  }}
                  aria-label={`Seleccionar escuela ${e.NOMBRE_ESCUELA || e.ID_ESCUELA}`}
                />
              </td>
              <td>{e.ID_ESCUELA}</td>
              <td>{e.NOMBRE_ESCUELA}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EscuelaList;
