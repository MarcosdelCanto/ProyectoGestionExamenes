function ExamenList({ examenes, selectedExamen, onSelectExamen, loading }) {
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
            <th>Inscritos</th>
            <th>Tipo de Procesamiento</th>
            <th>Plataforma</th>
            <th>Situación Evaluativa</th>
            <th>Cantidad de Módulos</th>
            <th>Sección</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {examenes.map((examen) => (
            <tr
              key={`examen-${examen.ID_EXAMEN}`}
              onClick={() => onSelectExamen(examen.ID_EXAMEN)}
              className={
                examen.ID_EXAMEN === selectedExamen ? 'table-primary' : ''
              }
              style={{ cursor: 'pointer' }}
            >
              <td>{examen.ID_EXAMEN || 'N/A'}</td>
              <td>{examen.NOMBRE_EXAMEN || 'N/A'}</td>
              <td>{examen.INSCRITOS_EXAMEN || 'N/A'}</td>
              <td>{examen.TIPO_PROCESAMIENTO_EXAMEN || 'N/A'}</td>
              <td>{examen.PLATAFORMA_PROSE_EXAMEN || 'N/A'}</td>
              <td>{examen.SITUACION_EVALUATIVA_EXAMEN || 'N/A'}</td>
              <td>{examen.CANTIDAD_MODULOS_EXAMEN || 'N/A'}</td>
              <td>{examen.NOMBRE_SECCION || 'N/A'}</td>
              <td>{examen.NOMBRE_ESTADO || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExamenList;
