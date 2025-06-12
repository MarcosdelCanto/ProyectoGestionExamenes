function EdificioActions({ onAdd, onEdit, onDelete, selectedEdificio }) {
  return (
    <div className="mb-3 d-flex flex-wrap align-items-center">
      <div className="sala-action-buttons d-flex flex-wrap">
        <button className="btn btn-success me-2" onClick={() => onAdd()}>
          <i className="bi bi-plus-lg"></i>
          <span className="btn-responsive-text ms-2">Agregar Edificio</span>
        </button>
        <button
          className="btn btn-warning me-2"
          onClick={() => onEdit()}
          disabled={!selectedEdificio}
        >
          <i className="bi bi-pencil-square"></i>
          <span className="btn-responsive-text ms-2">Modificar Edificio</span>
        </button>
        <button
          className="btn btn-danger"
          onClick={() => onDelete()}
          disabled={!selectedEdificio}
        >
          <i className="bi bi-trash"></i>
          <span className="btn-responsive-text ms-2">Eliminar Edificio</span>
        </button>
      </div>
    </div>
  );
}

export default EdificioActions;
