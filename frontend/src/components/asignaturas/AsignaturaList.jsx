function AsignaturaList({ asignaturas, selectedAsignatura, onSelectAsignatura, loading }) {
  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <table className="table table-bordered">
      <thead className="table-light">
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Carrera</th>
        </tr>
      </thead>
      <tbody>
        {asignaturas.map((a) => (
          <tr
            key={`asignatura-${a.ID_ASIGNATURA}`}
            onClick={() => onSelectAsignatura(a.ID_ASIGNATURA)}
            className={a.ID_ASIGNATURA === selectedAsignatura ? 'table-primary' : ''}
            style={{ cursor: 'pointer' }}
          >
            <td>{a.ID_ASIGNATURA || 'N/A'}</td>
            <td>{a.NOMBRE_ASIGNATURA || 'N/A'}</td>
            <td>{a.NOMBRE_CARRERA || 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default AsignaturaList;