function EdificioList({
  edificios,
  selectedEdificio,
  onSelectEdificio,
  loading,
}) {
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
        <thead className="table-light sticky-top">
          <tr>
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
              onClick={() => onSelectEdificio(e)} // Pasar el objeto completo o solo el ID según lo que espere onSelectEdificio
              className={
                selectedEdificio &&
                e.ID_EDIFICIO === selectedEdificio.ID_EDIFICIO
                  ? 'table-primary'
                  : ''
              } // Comparar con selectedEdificio.ID_EDIFICIO si selectedEdificio es un objeto
              style={{ cursor: 'pointer' }}
            >
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
