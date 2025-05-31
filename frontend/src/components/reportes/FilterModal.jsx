import React from 'react';
import Modal from 'react-modal';

/**
 * Componente FilterModal
 * Proporciona un contenedor de modal para los formularios de filtro.
 * La lógica de abrir/cerrar y el contenido del formulario se gestionan desde el componente padre.
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Controla si el modal está visible o no.
 * @param {function} props.onRequestClose - Función para cerrar el modal (ej: clic en 'escape' o fuera del modal).
 * @param {function} props.onApply - Función que se ejecuta al hacer clic en "Aplicar Filtros".
 * @param {string} props.title - El título que se mostrará en el encabezado del modal.
 * @param {React.ReactNode} props.children - El contenido del modal, usualmente el formulario de filtros.
 */
const FilterModal = ({ isOpen, onRequestClose, onApply, title, children }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={title}
      className="ReactModal__Content" // Clases CSS para estilizar el modal
      overlayClassName="ReactModal__Overlay" // Clases CSS para el fondo
    >
      <div className="modal-header">
        <h5 className="modal-title">{title}</h5>
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onRequestClose}
        ></button>
      </div>
      <div className="modal-body">
        {/* El contenido del formulario se renderiza aquí */}
        {children}
      </div>
      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRequestClose}
        >
          Cerrar
        </button>
        <button type="button" className="btn btn-primary" onClick={onApply}>
          Aplicar Filtros
        </button>
      </div>
    </Modal>
  );
};

export default FilterModal;
