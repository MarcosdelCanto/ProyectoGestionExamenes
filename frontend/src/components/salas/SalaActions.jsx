function SalaActions({ onAdd, onEdit, onDelete, selectedSala }) {
  return (
    <div className="mb-3">
      <button
        className="btn btn-success me-2"
        onClick={() => onAdd()}
      >
        Agregar Sala
      </button>
      <button
        className="btn btn-warning me-2"
        onClick={() => onEdit()}
        disabled={!selectedSala}
      >
        Modificar Sala
      </button>
      <button
        className="btn btn-danger"
        onClick={() => onDelete()}
        disabled={!selectedSala}
      >
        Eliminar Sala
      </button>
    </div>
  );
}

export default SalaActions;