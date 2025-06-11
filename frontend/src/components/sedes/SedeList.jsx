function SedeList({ sedes, selectedSede, onSelectSede, loading }) {
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
    <div
      className="table-responsive border"
      style={{ maxHeight: '60vh', overflowY: 'auto', marginBottom: '1rem' }}
    >
      <table className="table table-hover table-bordered mb-0">
        <thead className="table-light sticky-top">
          <tr>
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
              onClick={() => onSelectSede(sede)} // Pasar el objeto completo si es necesario para la lógica de selección en la página padre
              className={
                selectedSede && sede.ID_SEDE === selectedSede.ID_SEDE
                  ? 'table-primary'
                  : ''
              } // Asume que selectedSede es un objeto
              style={{ cursor: 'pointer' }}
            >
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
