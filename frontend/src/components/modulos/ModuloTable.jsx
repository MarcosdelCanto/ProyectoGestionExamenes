export default function ModuloTable({
  modulos,
  selectedModulo,
  onSelectModulo,
  loading,
}) {
  if (loading) {
    return <div>Cargando módulos…</div>;
  }

  return (
    <div
      className="table-responsive border"
      style={{
        maxHeight: '60vh',
        overflowY: 'auto',
        marginBottom: '1rem',
      }}
    >
      <table className="table table-bordered mb-0">
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
                modulo.ID_MODULO === selectedModulo ? 'table-primary' : ''
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
