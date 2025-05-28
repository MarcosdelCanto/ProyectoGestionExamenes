function SedeActions({ onAdd, onEdit, onDelete, selectedSede }) {
  return (
    <div className="mb-3">
      <button className="btn btn-success me-2" onClick={() => onAdd()}>
        <i className="bi bi-plus-lg"></i>
        <span className="btn-responsive-text ms-2">Agregar Sede</span>
      </button>
      <button
        className="btn btn-warning me-2"
        onClick={() => onEdit()}
        disabled={!selectedSede}
      >
        <i className="bi bi-pencil-square"></i>
        <span className="btn-responsive-text ms-2">Modificar Sede</span>
      </button>
      <button
        className="btn btn-danger"
        onClick={() => onDelete()}
        disabled={!selectedSede}
      >
        <i className="bi bi-trash"></i>
        <span className="btn-responsive-text ms-2">Eliminar Sede</span>
      </button>
    </div>
  );
}

export default SedeActions;
