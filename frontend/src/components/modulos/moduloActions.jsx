function ModuloActions({ onAdd, onEdit, onDelete, selectedModulo }) {
  return (
    <div className="mb-3">
      <button className="btn btn-success me-2" onClick={() => onAdd()}>
        <i className="bi bi-plus-lg"></i>
        <span className="btn-responsive-text ms-2">Crear Modulo</span>
      </button>
      <button
        className="btn btn-warning me-2"
        onClick={() => onEdit()}
        disabled={!selectedModulo}
      >
        <i className="bi bi-pencil-square"></i>
        <span className="btn-responsive-text ms-2">Modificar Módulo</span>
      </button>
      <button
        className="btn btn-danger"
        onClick={() => onDelete()}
        disabled={!selectedModulo}
      >
        <i className="bi bi-trash"></i>
        <span className="btn-responsive-text ms-2">Eliminar Módulo</span>
      </button>
    </div>
  );
}

export default ModuloActions;
