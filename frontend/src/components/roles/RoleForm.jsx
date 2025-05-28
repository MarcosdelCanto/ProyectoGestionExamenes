// src/components/roles/RoleForm.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form as BootstrapForm, Alert } from 'react-bootstrap'; // Usar Form de react-bootstrap

function RoleForm({
  show, // Prop para controlar la visibilidad del modal
  onHide, // Prop para cerrar el modal
  onSubmit,
  currentRole, // Para saber si estamos editando o creando
  initialData, // Datos iniciales para el formulario (cuando se edita)
  isProcessing,
  error, // Error a mostrar en el modal
}) {
  const [formData, setFormData] = useState({
    NOMBRE_ROL: '',
    // DESCRIPCION_ROL: '', // Campo eliminado
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        NOMBRE_ROL: initialData.NOMBRE_ROL || '',
        // DESCRIPCION_ROL: initialData.DESCRIPCION_ROL || '', // Campo eliminado
      });
    } else {
      setFormData({ NOMBRE_ROL: '' }); // Reset para creación, solo con NOMBRE_ROL
    }
  }, [initialData, show]); // Resetear el formulario si initialData cambia o el modal se muestra/oculta

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit(formData); // Pass formData to the parent's submit handler
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {currentRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
        </Modal.Title>
      </Modal.Header>
      <BootstrapForm onSubmit={handleSubmitForm}>
        <Modal.Body>
          {error && (
            // Usar Alert de react-bootstrap para consistencia
            <Alert variant="danger" onClose={onHide} dismissible>
              {error}
            </Alert>
          )}
          <BootstrapForm.Group className="mb-3" controlId="formRoleNameModal">
            <BootstrapForm.Label>
              Nombre del Rol <span className="text-danger">*</span>
            </BootstrapForm.Label>
            <BootstrapForm.Control
              type="text"
              name="NOMBRE_ROL"
              value={formData.NOMBRE_ROL}
              onChange={handleInputChange}
              required
              disabled={isProcessing}
            />
          </BootstrapForm.Group>
          {/* Grupo del formulario para Descripción eliminado */}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isProcessing}>
            {isProcessing
              ? currentRole
                ? 'Guardando...'
                : 'Creando...'
              : currentRole
                ? 'Guardar Cambios'
                : 'Crear Rol'}
          </Button>
        </Modal.Footer>
      </BootstrapForm>
    </Modal>
  );
}

export default RoleForm;
