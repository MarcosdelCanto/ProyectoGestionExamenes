function EscuelaActions({ onAdd, onEdit, onDelete, selectedEscuela }) {
  return (
    <div className="mb-3">
      <button
        className="btn btn-success me-2"
        onClick={() => onAdd()}
      >
        Agregar Escuela
      </button>
      <button
        className="btn btn-warning me-2"
        onClick={() => onEdit()}
        disabled={!selectedEscuela}
      >
        Modificar Escuela
      </button>
      <button
        className="btn btn-danger"
        onClick={() => onDelete()}
        disabled={!selectedEscuela}
      >
        Eliminar Escuela
      </button>
    </div>
  );
}

export default EscuelaActions;