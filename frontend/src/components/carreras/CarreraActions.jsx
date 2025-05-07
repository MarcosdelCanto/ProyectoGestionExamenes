function CarreraActions({ onAdd, onEdit, onDelete, selectedCarrera }) {
  return (
    <div className="mb-3">
      <button
        className="btn btn-success me-2"
        onClick={() => onAdd()}
      >
        Agregar Carrera
      </button>
      <button
        className="btn btn-warning me-2"
        onClick={() => onEdit()}
        disabled={!selectedCarrera}
      >
        Modificar Carrera
      </button>
      <button
        className="btn btn-danger"
        onClick={() => onDelete()}
        disabled={!selectedCarrera}
      >
        Eliminar Carrera
      </button>
    </div>
  );
}

export default CarreraActions;