function EscuelaList({ escuelas, selectedEscuela, onSelectEscuela, loading }) {
  if (loading) {
    return <div>Cargando...</div>;
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
        <thead className="table-light">
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Sede</th>
          </tr>
        </thead>
        <tbody>
          {escuelas.map((escuela) => (
            <tr
              key={`escuela-${escuela.ID_ESCUELA}`}
              onClick={() => onSelectEscuela(escuela.ID_ESCUELA)}
              className={
                escuela.ID_ESCUELA === selectedEscuela ? 'table-primary' : ''
              }
              style={{ cursor: 'pointer' }}
            >
              <td>{escuela.ID_ESCUELA || 'N/A'}</td>
              <td>{escuela.NOMBRE_ESCUELA || 'N/A'}</td>
              <td>{escuela.NOMBRE_SEDE || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EscuelaList;
