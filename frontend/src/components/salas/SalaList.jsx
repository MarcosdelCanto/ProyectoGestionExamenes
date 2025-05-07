function SalaList({ salas, selectedSala, onSelectSala, loading }) {
  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <table className="table table-bordered">
      <thead className="table-light">
        <tr>
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
            onClick={() => onSelectSala(sala.ID_SALA)}
            className={sala.ID_SALA === selectedSala ? 'table-primary' : ''}
            style={{ cursor: 'pointer' }}
          >
            <td>{sala.ID_SALA || 'N/A'}</td>
            <td>{sala.NOMBRE_SALA || 'N/A'}</td>
            <td>{sala.CAPACIDAD_SALA || 'N/A'}</td>
            <td>{sala.NOMBRE_EDIFICIO || 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default SalaList;