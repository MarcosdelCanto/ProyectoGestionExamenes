function AsignaturaActions({ onAdd, onEdit, onDelete, selectedAsignatura }) {
  return (
    <div className="mb-3">
      <button
        className="btn btn-success me-2"
        onClick={() => onAdd()}
      >
        Agregar Asignatura
      </button>
      <button
        className="btn btn-warning me-2"
        onClick={() => onEdit()}
        disabled={!selectedAsignatura}
      >
        Modificar Asignatura
      </button>
      <button
        className="btn btn-danger"
        onClick={() => onDelete()}
        disabled={!selectedAsignatura}
      >
        Eliminar Asignatura
      </button>
    </div>
  );
}

export default AsignaturaActions;