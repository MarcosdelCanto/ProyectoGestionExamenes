function EdificioActions({
  onAdd,
  onEdit,
  onDelete,
  selectedEdificios, // Cambiado a array
  disabled, // Prop general para deshabilitar todos los botones
}) {
  return (
    <div className="mb-3 d-flex flex-wrap align-items-center">
      <div className="sala-action-buttons d-flex flex-wrap">
        <button
          className="btn btn-success me-2 btn-icon-only-candidate"
          onClick={onAdd}
          disabled={disabled}
          title="Agregar Nuevo Edificio"
        >
          <i className="bi bi-plus-lg"></i>
          <span className="btn-responsive-text ms-2">Agregar Edificio</span>
        </button>
        <button
          className="btn btn-warning me-2 btn-icon-only-candidate"
          onClick={onEdit}
          disabled={
            disabled || !selectedEdificios || selectedEdificios.length !== 1
          }
          title="Modificar Edificio Seleccionado"
        >
          <i className="bi bi-pencil-square"></i>
          <span className="btn-responsive-text ms-2">Modificar Edificio</span>
        </button>
        <button
          className="btn btn-danger btn-icon-only-candidate"
          onClick={onDelete}
          disabled={
            disabled || !selectedEdificios || selectedEdificios.length === 0
          }
          title="Eliminar Edificios Seleccionados"
        >
          <i className="bi bi-trash"></i>
          <span className="btn-responsive-text ms-2">Eliminar Edificio</span>
        </button>
      </div>
    </div>
  );
}
export default EdificioActions;
