import React from 'react';

function SeccionList({
  secciones,
  selectedSecciones, // Cambiado de selectedSeccion a selectedSecciones (array)
  onToggleSeccionSelection, // Nueva función para manejar la selección individual
  onToggleSelectAll, // Nueva función para seleccionar/deseleccionar todo
  loading,
}) {
  if (loading) {
    return <div>Cargando secciones...</div>;
  }

  if (!secciones || secciones.length === 0) {
    return (
      <div className="alert alert-info text-center">
        No hay secciones para mostrar.
      </div>
    );
  }

  return (
    <div className="table-responsive border mb-3">
      <table className="table table-hover table-bordered mb-0">
        <thead className="table-light sticky-top">
          <tr>
            <th style={{ width: '5%' }} className="text-center align-middle">
              <input
                type="checkbox"
                className="form-check-input"
                checked={
                  secciones.length > 0 &&
                  selectedSecciones.length === secciones.length
                }
                onChange={onToggleSelectAll}
                disabled={secciones.length === 0}
                aria-label="Seleccionar todas las secciones"
              />
            </th>
            <th className="align-middle">ID</th>
            <th className="align-middle">Nombre</th>
            <th className="align-middle">Asignatura ID</th>
            <th className="align-middle">Profesor ID</th>
            <th className="align-middle">Carrera ID</th>
          </tr>
        </thead>
        <tbody>
          {secciones.map((s) => (
            <tr
              key={`seccion-${s.ID_SECCION}`}
              onClick={() => onToggleSeccionSelection(s)} // Llama a la nueva función con la sección completa
              className={`align-middle ${
                selectedSecciones.find((ss) => ss.ID_SECCION === s.ID_SECCION)
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
                    !!selectedSecciones.find(
                      (ss) => ss.ID_SECCION === s.ID_SECCION
                    )
                  }
                  onChange={(e) => {
                    e.stopPropagation(); // Evita que el onClick de la fila se dispare también
                    onToggleSeccionSelection(s);
                  }}
                  aria-label={`Seleccionar sección ${s.NOMBRE_SECCION || s.ID_SECCION}`}
                />
              </td>
              <td>{s.ID_SECCION || 'N/A'}</td>
              <td>{s.NOMBRE_SECCION || 'N/A'}</td>
              {/* Asume que tienes los IDs, si tienes los nombres, úsalos */}
              <td>
                {s.ASIGNATURA_ID_ASIGNATURA || s.NOMBRE_ASIGNATURA || 'N/A'}
              </td>
              <td>{s.PROFESOR_ID_PROFESOR || s.NOMBRE_PROFESOR || 'N/A'}</td>
              <td>{s.CARRERA_ID_CARRERA || s.NOMBRE_CARRERA || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SeccionList;
