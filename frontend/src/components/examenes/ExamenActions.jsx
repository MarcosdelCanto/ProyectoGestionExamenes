function ExamenActions({ onAdd, onEdit, onDelete, selectedExamen }) {
  return (
    <div className="mb-3">
      <button className="btn btn-success me-2" onClick={() => onAdd()}>
        Agregar Examen
      </button>
      <button
        className="btn btn-warning me-2"
        onClick={() => onEdit()}
        disabled={!selectedExamen}
      >
        Modificar Examen
      </button>
      <button
        className="btn btn-danger"
        onClick={() => onDelete()}
        disabled={!selectedExamen}
      >
        Eliminar Examen
      </button>
    </div>
  );
}
export default ExamenActions;
