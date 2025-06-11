function SalaList({ salas, selectedSala, onSelectSala, loading }) {
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
      {/* Eliminado maxHeight y overflowY, usado mb-3 para margen */}
      <table className="table table-hover table-bordered mb-0">
        <thead className="table-light sticky-top">
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Capacidad</th>
            <th>Edificio</th>
            {/* Asumiendo que NOMBRE_EDIFICIO viene con el objeto sala */}
          </tr>
        </thead>
        <tbody>
          {salas.map((sala) => (
            <tr
              key={`sala-${sala.ID_SALA}`}
              onClick={() => onSelectSala(sala)} // Pasar el objeto sala completo
              className={
                selectedSala && sala.ID_SALA === selectedSala.ID_SALA
                  ? 'table-primary'
                  : ''
              } // Comparar con selectedSala.ID_SALA si selectedSala es un objeto
              style={{ cursor: 'pointer' }}
            >
              <td>{sala.ID_SALA || 'N/A'}</td>
              <td>{sala.NOMBRE_SALA || 'N/A'}</td>
              <td>{sala.CAPACIDAD_SALA || 'N/A'}</td>
              <td>
                {sala.NOMBRE_EDIFICIO || sala.EDIFICIO_ID_EDIFICIO || 'N/A'}
              </td>
              {/* Mostrar NOMBRE_EDIFICIO o el ID si el nombre no está */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SalaList;
