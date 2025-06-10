function ExamenActions({ onAdd, onEdit, onDelete, isExamenSelected }) {
  return (
    <div className="mb-3">
      <button className="btn btn-success me-2" onClick={() => onAdd()}>
        <i className="bi bi-plus-lg"></i>
        <span className="btn-responsive-text ms-2">Agregar Examen</span>
      </button>
      <button
        className="btn btn-warning me-2"
        onClick={() => onEdit()}
        disabled={!isExamenSelected}
      >
        <i className="bi bi-pencil-square"></i>
        <span className="btn-responsive-text ms-2">Modificar Examen</span>
      </button>
      <button
        className="btn btn-danger"
        onClick={() => onDelete()}
        disabled={!isExamenSelected}
      >
        <i className="bi bi-trash"></i>
        <span className="btn-responsive-text ms-2">Eliminar Examen</span>
      </button>
    </div>
  );
}
export default ExamenActions;
