function SedeActions({
  onAdd,
  onEdit,
  onDelete,
  selectedSedes, // Cambiado a array
  disabled, // Prop general para deshabilitar todos los botones
}) {
  return (
    <div className="mb-3 d-flex flex-wrap align-items-center">
      <div className="sala-action-buttons d-flex flex-wrap">
        <button
          className="btn btn-success me-2 btn-icon-only-candidate"
          onClick={onAdd}
          disabled={disabled}
          title="Agregar Nueva Sede"
        >
          <i className="bi bi-plus-lg"></i>
          <span className="btn-responsive-text ms-2">Agregar Sede</span>
        </button>
        <button
          className="btn btn-warning me-2 btn-icon-only-candidate"
          onClick={onEdit}
          disabled={disabled || !selectedSedes || selectedSedes.length !== 1}
          title="Modificar Sede Seleccionada"
        >
          <i className="bi bi-pencil-square"></i>
          <span className="btn-responsive-text ms-2">Modificar Sede</span>
        </button>
        <button
          className="btn btn-danger btn-icon-only-candidate"
          onClick={onDelete}
          disabled={disabled || !selectedSedes || selectedSedes.length === 0}
          title="Eliminar Sedes Seleccionadas"
        >
          <i className="bi bi-trash"></i>
          <span className="btn-responsive-text ms-2">Eliminar Sede</span>
        </button>
      </div>
    </div>
  );
}
export default SedeActions;
