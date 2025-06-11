export default function ModuloTable({
  modulos,
  selectedModuloId, // Cambiado de selectedModulo a selectedModuloId
  onSelectModulo,
  loading,
}) {
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
    <div
      className="table-responsive"
      style={{
        maxHeight: '60vh',
        overflowY: 'auto',
        marginBottom: '1rem',
      }}
    >
      <table className="table table-hover table-bordered">
        <thead className="table-light position-sticky top-0">
          <tr>
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
              onClick={() => onSelectModulo(modulo.ID_MODULO)}
              className={
                modulo.ID_MODULO === selectedModuloId ? 'table-primary' : '' // Usar selectedModuloId
              }
              style={{ cursor: 'pointer' }}
            >
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
