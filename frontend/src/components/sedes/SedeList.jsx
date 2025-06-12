function SedeList({
  sedes, // Estos son los items paginados/filtrados
  selectedSedes = [], // Default to an empty array
  onToggleSedeSelection,
  onToggleSelectAllSedes,
  loading,
}) {
  // sedes aquí son los currentSedes (paginados y filtrados)
  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si no está cargando y no hay sedes, mostrar el mensaje.
  // Esta verificación se hace ANTES de renderizar la estructura de la tabla.
  if (!Array.isArray(sedes) || sedes.length === 0) {
    return (
      <div className="alert alert-info text-center">
        No hay sedes para mostrar.
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
                  sedes.length > 0 &&
                  sedes.every((s) =>
                    selectedSedes.some((ss) => ss.ID_SEDE === s.ID_SEDE)
                  )
                }
                onChange={onToggleSelectAllSedes}
                disabled={sedes.length === 0}
                aria-label="Seleccionar todas las sedes en esta página"
              />
            </th>
            <th>ID</th>
            <th>Nombre</th>
            {/* Puedes añadir más columnas si las tienes, como Dirección */}
            {/* <th>Dirección</th> */}
          </tr>
        </thead>
        <tbody>
          {sedes.map((sede) => (
            <tr
              key={`sede-${sede.ID_SEDE}`}
              onClick={() => onToggleSedeSelection(sede)}
              className={
                selectedSedes.find((s) => s.ID_SEDE === sede.ID_SEDE)
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
                    !!selectedSedes.find((s) => s.ID_SEDE === sede.ID_SEDE)
                  }
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSedeSelection(sede);
                  }}
                  aria-label={`Seleccionar sede ${sede.NOMBRE_SEDE || sede.ID_SEDE}`}
                />
              </td>
              <td>{sede.ID_SEDE || 'N/A'}</td>
              <td>{sede.NOMBRE_SEDE || 'N/A'}</td>
              {/* <td>{sede.DIRECCION_SEDE || 'N/A'}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SedeList;
