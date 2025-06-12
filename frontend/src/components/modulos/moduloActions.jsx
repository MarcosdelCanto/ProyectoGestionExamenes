function ModuloActions({
  onAdd,
  onEdit,
  onDelete,
  selectedModulos, // Array de módulos seleccionados
  disabled, // Para deshabilitar todos los botones (ej. durante carga o procesamiento)
}) {
  return (
    <div className="mb-3">
      <button
        className="btn btn-success me-2 btn-icon-only-candidate"
        onClick={onAdd}
        disabled={disabled}
        title="Crear Nuevo Módulo"
      >
        <i className="bi bi-plus-lg"></i>
        <span className="btn-responsive-text ms-2">Crear Módulo</span>
      </button>
      <button
        className="btn btn-warning me-2 btn-icon-only-candidate"
        onClick={onEdit}
        disabled={disabled || selectedModulos.length !== 1}
        title="Modificar Módulo Seleccionado"
      >
        <i className="bi bi-pencil-square"></i>
        <span className="btn-responsive-text ms-2">Modificar Módulo</span>
      </button>
      <button
        className="btn btn-danger btn-icon-only-candidate"
        onClick={onDelete}
        disabled={disabled || selectedModulos.length === 0}
        title="Eliminar Módulos Seleccionados"
      >
        <i className="bi bi-trash"></i>
        <span className="btn-responsive-text ms-2">Eliminar Módulo</span>
      </button>
    </div>
  );
}

export default ModuloActions;
