import React from 'react';
import { Table } from 'react-bootstrap'; // Asumiendo que usas react-bootstrap Table

function AsignaturaList({
  asignaturas,
  selectedAsignaturas, // Cambiado de selectedAsignatura a selectedAsignaturas (array)
  onToggleAsignaturaSelection, // Nueva función para manejar la selección individual
  onToggleSelectAll, // Nueva función para seleccionar/deseleccionar todo
  loading,
}) {
  if (loading) {
    return <div>Cargando asignaturas...</div>;
  }

  if (!asignaturas || asignaturas.length === 0) {
    return <div>No hay asignaturas para mostrar.</div>;
  }

  return (
    <div className="table-responsive">
      <Table bordered hover responsive="sm" className="mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ width: '5%' }} className="text-center align-middle">
              <input
                type="checkbox"
                className="form-check-input"
                checked={
                  asignaturas.length > 0 &&
                  selectedAsignaturas.length === asignaturas.length
                }
                onChange={onToggleSelectAll}
                disabled={asignaturas.length === 0}
                aria-label="Seleccionar todas las asignaturas"
              />
            </th>
            <th className="align-middle">ID</th>
            <th className="align-middle">Nombre</th>
            <th className="align-middle">Carrera</th>
          </tr>
        </thead>
        <tbody>
          {asignaturas.map((a) => (
            <tr
              key={`asignatura-${a.ID_ASIGNATURA}`}
              onClick={() => onToggleAsignaturaSelection(a)}
              className={`align-middle ${
                selectedAsignaturas.find(
                  (sa) => sa.ID_ASIGNATURA === a.ID_ASIGNATURA
                )
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
                    !!selectedAsignaturas.find(
                      (sa) => sa.ID_ASIGNATURA === a.ID_ASIGNATURA
                    )
                  }
                  onChange={(e) => {
                    e.stopPropagation(); // Evita que el onClick de la fila se dispare también
                    onToggleAsignaturaSelection(a);
                  }}
                  aria-label={`Seleccionar asignatura ${a.NOMBRE_ASIGNATURA || a.ID_ASIGNATURA}`}
                />
              </td>
              <td>{a.ID_ASIGNATURA}</td>
              <td>{a.NOMBRE_ASIGNATURA}</td>
              <td>{a.NOMBRE_CARRERA || a.CARRERA_ID_CARRERA}</td>
              {/* Muestra nombre de carrera si está disponible */}
              {/* Renderiza más celdas si es necesario */}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default AsignaturaList;
