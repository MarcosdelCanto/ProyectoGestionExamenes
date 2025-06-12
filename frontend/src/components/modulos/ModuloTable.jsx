export default function ModuloTable({
  modulos,
  selectedModulos,
  onToggleModuloSelection,
  onToggleSelectAllModulos,
  loading,
}) {
  // modulos aquí son los currentModulos (paginados)
  if (loading) {
    return <div>Cargando módulos…</div>;
  }

  // Si no está cargando y no hay módulos, mostrar el mensaje.
  // Esta verificación se hace ANTES de renderizar la estructura de la tabla.
  if (!Array.isArray(modulos) || modulos.length === 0) {
    return (
      <div className="alert alert-info text-center">
        No hay módulos para mostrar.
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
                  modulos.length > 0 &&
                  modulos.every((m) =>
                    selectedModulos.some((sm) => sm.ID_MODULO === m.ID_MODULO)
                  )
                }
                onChange={onToggleSelectAllModulos}
                disabled={modulos.length === 0}
                aria-label="Seleccionar todos los módulos en esta página"
              />
            </th>
            <th>Orden</th>
            <th>Nombre</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {modulos.map((modulo) => (
            <tr
              key={`modulo-${modulo.ID_MODULO}`}
              onClick={() => onToggleModuloSelection(modulo)}
              className={
                selectedModulos.find((m) => m.ID_MODULO === modulo.ID_MODULO)
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
                    !!selectedModulos.find(
                      (m) => m.ID_MODULO === modulo.ID_MODULO
                    )
                  }
                  onChange={(e) => {
                    e.stopPropagation(); // Evita que el onClick de la fila se dispare también
                    onToggleModuloSelection(modulo);
                  }}
                  aria-label={`Seleccionar módulo ${modulo.NOMBRE_MODULO || modulo.ID_MODULO}`}
                />
              </td>
              <td>{modulo.ORDEN}</td>
              <td>{modulo.NOMBRE_MODULO}</td>
              <td>{modulo.INICIO_MODULO}</td>
              <td>{modulo.FIN_MODULO}</td>
              <td>{modulo.NOMBRE_ESTADO}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
