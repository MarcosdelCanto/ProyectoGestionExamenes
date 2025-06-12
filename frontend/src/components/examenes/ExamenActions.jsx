function ExamenActions({
  onAdd,
  onEdit,
  onDelete,
  selectedExamenes, // Array of selected examen objects
  disabled, // General disable flag (e.g., during loading or processing)
}) {
  return (
    <div className="mb-3">
      <button
        className="btn btn-success me-2 btn-icon-only-candidate"
        onClick={onAdd}
        disabled={disabled}
        title="Agregar Nuevo Examen"
      >
        <i className="bi bi-plus-lg"></i>
        <span className="btn-responsive-text ms-2">Agregar Examen</span>
      </button>
      <button
        className="btn btn-warning me-2 btn-icon-only-candidate"
        onClick={onEdit}
        disabled={
          disabled || !selectedExamenes || selectedExamenes.length !== 1
        }
        title="Modificar Examen Seleccionado"
      >
        <i className="bi bi-pencil-square"></i>
        <span className="btn-responsive-text ms-2">Modificar Examen</span>
      </button>
      <button
        className="btn btn-danger btn-icon-only-candidate"
        onClick={onDelete}
        disabled={
          disabled || !selectedExamenes || selectedExamenes.length === 0
        }
        title="Eliminar Exámenes Seleccionados"
      >
        <i className="bi bi-trash"></i>
        <span className="btn-responsive-text ms-2">Eliminar Examen</span>
      </button>
    </div>
  );
}

export default ExamenActions;
