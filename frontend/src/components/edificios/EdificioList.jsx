function EdificioList({ edificios, selectedEdificio, onSelectEdificio, loading }) {
  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <table className="table table-bordered">
      <thead className="table-light">
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Sigla</th>
          <th>Sede</th>
        </tr>
      </thead>
      <tbody>
        {edificios.map((e) => (
          <tr
            key={`edificio-${e.ID_EDIFICIO}`}
            onClick={() => onSelectEdificio(e.ID_EDIFICIO)}
            className={e.ID_EDIFICIO === selectedEdificio ? 'table-primary' : ''}
            style={{ cursor: 'pointer' }}
          >
            <td>{e.ID_EDIFICIO}</td>
            <td>{e.NOMBRE_EDIFICIO}</td>
            <td>{e.SIGLA_EDIFICIO}</td>
            <td>{e.NOMBRE_SEDE}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default EdificioList;