function EdificioList({
  edificios,
  selectedEdificios = [], // Default to an empty array
  onToggleEdificioSelection,
  onToggleSelectAllEdificios,
  loading,
}) {
  // edificios aquí son los currentEdificios (paginados y filtrados)
  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si no está cargando y no hay edificios, mostrar el mensaje.
  // Esta verificación se hace ANTES de renderizar la estructura de la tabla.
  if (!Array.isArray(edificios) || edificios.length === 0) {
    return (
      <div className="alert alert-info text-center">
        No hay edificios para mostrar.
      </div>
    );
  }

  return (
    <div className="table-responsive border mb-3">
      {/* Eliminado maxHeight y overflowY, usado mb-3 para margen */}
      <table className="table table-hover table-bordered mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ width: '5%' }} className="text-center align-middle">
              <input
                type="checkbox"
                className="form-check-input"
                checked={
                  edificios.length > 0 &&
                  edificios.every((e) =>
                    selectedEdificios.some(
                      (se) => se.ID_EDIFICIO === e.ID_EDIFICIO
                    )
                  )
                }
                onChange={onToggleSelectAllEdificios}
                disabled={edificios.length === 0}
                aria-label="Seleccionar todos los edificios en esta página"
              />
            </th>
            <th>ID</th>
            <th>Nombre</th>
            <th>Sigla</th>
            <th>Sede</th>
            {/* Asumiendo que NOMBRE_SEDE viene con el objeto edificio */}
          </tr>
        </thead>
        <tbody>
          {edificios.map((e) => (
            <tr
              key={`edificio-${e.ID_EDIFICIO}`}
              onClick={() => onToggleEdificioSelection(e)}
              className={
                selectedEdificios.find((ed) => ed.ID_EDIFICIO === e.ID_EDIFICIO)
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
                    !!selectedEdificios.find(
                      (ed) => ed.ID_EDIFICIO === e.ID_EDIFICIO
                    )
                  }
                  onChange={(event) => {
                    event.stopPropagation();
                    onToggleEdificioSelection(e);
                  }}
                  aria-label={`Seleccionar edificio ${e.NOMBRE_EDIFICIO || e.ID_EDIFICIO}`}
                />
              </td>
              <td>{e.ID_EDIFICIO || 'N/A'}</td>
              <td>{e.NOMBRE_EDIFICIO || 'N/A'}</td>
              <td>{e.SIGLA_EDIFICIO || 'N/A'}</td>
              <td>{e.NOMBRE_SEDE || e.SEDE_ID_SEDE || 'N/A'}</td>
              {/* Mostrar NOMBRE_SEDE o el ID si el nombre no está */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EdificioList;
