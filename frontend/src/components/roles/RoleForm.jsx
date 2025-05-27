import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Form as BootstrapForm,
  Alert,
  FormCheck,
} from 'react-bootstrap';
import {
  fetchAllPermisos,
  fetchPermisosByRol,
} from '../../services/permisoService';

function RoleForm({
  show,
  onHide,
  onSubmit,
  currentRole,
  initialData,
  isProcessing,
  error,
}) {
  const [formData, setFormData] = useState({
    NOMBRE_ROL: '',
    permisos: [],
  });
  const [allPermisos, setAllPermisos] = useState([]);

  useEffect(() => {
    const loadPermisos = async () => {
      const permisos = await fetchAllPermisos();
      setAllPermisos(permisos);

      if (currentRole) {
        const permisosRol = await fetchPermisosByRol(currentRole.ID_ROL);
        setFormData({
          NOMBRE_ROL: currentRole.NOMBRE_ROL || '',
          permisos: permisosRol.map((p) => p.ID_PERMISO),
        });
      } else {
        setFormData({ NOMBRE_ROL: '', permisos: [] });
      }
    };
    loadPermisos();
  }, [currentRole, show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit(formData); // Pass formData to the parent's submit handler
  };

  const handlePermisoChange = (idPermiso) => {
    setFormData((prev) => ({
      ...prev,
      permisos: prev.permisos.includes(idPermiso)
        ? prev.permisos.filter((id) => id !== idPermiso)
        : [...prev.permisos, idPermiso],
    }));
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
        <Modal.Body>
          {error && (
            <Alert variant="danger" onClose={onHide} dismissible>
              {error}
            </Alert>
          )}

          <BootstrapForm.Group className="mb-3">
            <BootstrapForm.Label>Permisos:</BootstrapForm.Label>
            <div className="ms-3">
              {allPermisos.map((permiso) => (
                <FormCheck
                  key={permiso.ID_PERMISO}
                  type="checkbox"
                  id={`permiso-${permiso.ID_PERMISO}`}
                  label={permiso.NOMBRE_PERMISO}
                  checked={formData.permisos.includes(permiso.ID_PERMISO)}
                  onChange={() => handlePermisoChange(permiso.ID_PERMISO)}
                />
              ))}
            </div>
          </BootstrapForm.Group>
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
