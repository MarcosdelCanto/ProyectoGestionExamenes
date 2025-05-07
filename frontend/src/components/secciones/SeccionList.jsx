function SeccionList({ secciones, selectedSeccion, onSelectSeccion, loading }) {
  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <table className="table table-bordered">
      <thead className="table-light">
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Asignatura</th>
          <th>Profesor</th>
          <th>Carrera</th>
        </tr>
      </thead>
      <tbody>
        {secciones.map((s) => (
          <tr
            key={`seccion-${s.ID_SECCION}`}
            onClick={() => onSelectSeccion(s.ID_SECCION)}
            className={s.ID_SECCION === selectedSeccion ? 'table-primary' : ''}
            style={{ cursor: 'pointer' }}
          >
            <td>{s.ID_SECCION || 'N/A'}</td>
            <td>{s.NOMBRE_SECCION || 'N/A'}</td>
            <td>{s.ASIGNATURA_ID_ASIGNATURA || 'N/A'}</td>
            <td>{s.PROFESOR_ID_PROFESOR || 'N/A'}</td>
            <td>{s.CARRERA_ID_CARRERA || 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default SeccionList;