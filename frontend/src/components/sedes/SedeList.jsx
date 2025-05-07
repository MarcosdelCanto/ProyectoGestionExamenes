function SedeList({ sedes, selectedSede, onSelectSede, loading }) {
  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <table className="table table-bordered">
      <thead className="table-light">
        <tr>
          <th>ID</th>
          <th>Nombre</th>
        </tr>
      </thead>
      <tbody>
        {sedes.map((s) => (
          <tr
            key={`sede-${s.ID_SEDE}`}
            onClick={() => onSelectSede(s.ID_SEDE)}
            className={s.ID_SEDE === selectedSede ? 'table-primary' : ''}
            style={{ cursor: 'pointer' }}
          >
            <td>{s.ID_SEDE}</td>
            <td>{s.NOMBRE_SEDE}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default SedeList;