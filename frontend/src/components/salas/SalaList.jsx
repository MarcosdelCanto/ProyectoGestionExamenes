function SalaList({
  salas, // Estos son los items paginados/filtrados
  selectedSalas = [], // Default to an empty array
  onToggleSalaSelection,
  onToggleSelectAllSalas,
  loading,
}) {
  // salas aquí son los currentSalas (paginados y filtrados)
  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si no está cargando y no hay salas, mostrar el mensaje.
  // Esta verificación se hace ANTES de renderizar la estructura de la tabla.
  if (!Array.isArray(salas) || salas.length === 0) {
    return (
      <div className="alert alert-info text-center">
        No hay salas para mostrar.
      </div>
    );
  }

  return (
    <div className="table-responsive border mb-3">
      <table className="table table-hover table-bordered mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ width: '5%' }} className="text-center align-middle">
              <input
                type="checkbox"
                className="form-check-input"
                checked={
                  salas.length > 0 &&
                  salas.every((s) =>
                    selectedSalas.some((ss) => ss.ID_SALA === s.ID_SALA)
                  )
                }
                onChange={onToggleSelectAllSalas}
                disabled={salas.length === 0}
                aria-label="Seleccionar todas las salas en esta página"
              />
            </th>
            <th>ID</th>
            <th>Nombre</th>
            <th>Capacidad</th>
            <th>Edificio</th>
          </tr>
        </thead>
        <tbody>
          {salas.map((sala) => (
            <tr
              key={`sala-${sala.ID_SALA}`}
              onClick={() => onToggleSalaSelection(sala)}
              className={
                selectedSalas.find((s) => s.ID_SALA === sala.ID_SALA)
                  ? 'table-primary'
                  : ''
              }
              style={{ cursor: 'pointer' }}
            >
              <td className="text-center align-middle">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={
                    !!selectedSalas.find((s) => s.ID_SALA === sala.ID_SALA)
                  }
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSalaSelection(sala);
                  }}
                  aria-label={`Seleccionar sala ${sala.NOMBRE_SALA || sala.ID_SALA}`}
                />
              </td>
              <td>{sala.ID_SALA || 'N/A'}</td>
              <td>{sala.NOMBRE_SALA || 'N/A'}</td>
              <td>{sala.CAPACIDAD_SALA || 'N/A'}</td>
              <td>
                {sala.NOMBRE_EDIFICIO || sala.EDIFICIO_ID_EDIFICIO || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SalaList;
