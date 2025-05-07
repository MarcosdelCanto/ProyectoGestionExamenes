function CarreraList({ carreras, selectedCarrera, onSelectCarrera, loading }) {
  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <table className="table table-bordered">
      <thead className="table-light">
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Escuela</th>
        </tr>
      </thead>
      <tbody>
        {carreras.map((carrera) => (
          <tr
            key={`carrera-${carrera.ID_CARRERA}`}
            onClick={() => onSelectCarrera(carrera.ID_CARRERA)}
            className={carrera.ID_CARRERA === selectedCarrera ? 'table-primary' : ''}
            style={{ cursor: 'pointer' }}
          >
            <td>{carrera.ID_CARRERA || 'N/A'}</td>
            <td>{carrera.NOMBRE_CARRERA || 'N/A'}</td>
            <td>{carrera.NOMBRE_ESCUELA || 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default CarreraList;