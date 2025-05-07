function SedeActions({ onAdd, onEdit, onDelete, selectedSede }) {
  return (
    <div className="mb-3">
      <button
        className="btn btn-success me-2"
        onClick={() => onAdd()}
      >
        Agregar Sede
      </button>
      <button
        className="btn btn-warning me-2"
        onClick={() => onEdit()}
        disabled={!selectedSede}
      >
        Modificar Sede
      </button>
      <button
        className="btn btn-danger"
        onClick={() => onDelete()}
        disabled={!selectedSede}
      >
        Eliminar Sede
      </button>
    </div>
  );
}

export default SedeActions;