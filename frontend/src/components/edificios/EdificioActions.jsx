function EdificioActions({ onAdd, onEdit, onDelete, selectedEdificio }) {
  return (
    <div className="mb-3">
      <button
        className="btn btn-success me-2"
        onClick={() => onAdd()}
      >
        Agregar Edificio
      </button>
      <button
        className="btn btn-warning me-2"
        onClick={() => onEdit()}
        disabled={!selectedEdificio}
      >
        Modificar Edificio
      </button>
      <button
        className="btn btn-danger"
        onClick={() => onDelete()}
        disabled={!selectedEdificio}
      >
        Eliminar Edificio
      </button>
    </div>
  );
}

export default EdificioActions;