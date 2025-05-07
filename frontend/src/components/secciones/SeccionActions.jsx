function SeccionActions({ onAdd, onEdit, onDelete, selectedSeccion }) {
  return (
    <div className="mb-3">
      <button
        className="btn btn-success me-2"
        onClick={() => onAdd()}
      >
        Agregar Sección
      </button>
      <button
        className="btn btn-warning me-2"
        onClick={() => onEdit()}
        disabled={!selectedSeccion}
      >
        Modificar Sección
      </button>
      <button
        className="btn btn-danger"
        onClick={() => onDelete()}
        disabled={!selectedSeccion}
      >
        Eliminar Sección
      </button>
    </div>
  );
}

export default SeccionActions;