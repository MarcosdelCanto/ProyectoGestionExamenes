// src/components/roles/RoleForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Form as BootstrapForm,
  Alert,
  FormCheck,
} from 'react-bootstrap';
import { Col, Row } from 'react-bootstrap';
import { fetchAllPermisos } from '../../services/permisoService'; // Solo necesitamos este servicio ahora

function RoleForm({
  show,
  onHide,
  onSubmit,
  currentRole, // Este objeto AHORA debería venir con currentRole.permisos desde el backend
  isProcessing,
  error,
}) {
  const [formData, setFormData] = useState({
    NOMBRE_ROL: '',
    permisos: [], // Array de IDs de permisos seleccionados
  });
  const [allPermisos, setAllPermisos] = useState([]); // Array de todos los permisos disponibles en el sistema
  const [loadingPermisos, setLoadingPermisos] = useState(false); // Estado de carga para los permisos

  useEffect(() => {
    // Solo ejecutar si el modal se muestra
    if (show) {
      const loadAllAvailablePermisos = async () => {
        setLoadingPermisos(true);
        try {
          const permisosDisponibles = await fetchAllPermisos();
          setAllPermisos(permisosDisponibles || []);
        } catch (err) {
          console.error('Error al cargar la lista de todos los permisos:', err);
          setAllPermisos([]);
          // Podrías pasar un error específico para esta carga si lo deseas
        } finally {
          setLoadingPermisos(false);
        }
      };

      loadAllAvailablePermisos();

      // Si estamos editando un rol (currentRole existe),
      // usamos los permisos que ya vienen en ese objeto.
      if (currentRole) {
        setFormData({
          NOMBRE_ROL: currentRole.NOMBRE_ROL || '',
          // currentRole.permisos debería ser un array de objetos { ID_PERMISO, NOMBRE_PERMISO, ... }
          // Mapeamos para obtener solo los IDs para nuestro estado formData.permisos
          permisos: currentRole.permisos
            ? currentRole.permisos.map((p) => p.ID_PERMISO)
            : [],
        });
      } else {
        // Si estamos creando un nuevo rol, reseteamos el formulario
        setFormData({ NOMBRE_ROL: '', permisos: [] });
      }
    }
  }, [currentRole, show]); // Dependencias: se ejecuta cuando currentRole o show cambian

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit(formData); // formData ya contiene { NOMBRE_ROL, permisos: [id1, id2, ...] }
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
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      {/* Opcional: size="lg" para más espacio */}
      <Modal.Header closeButton>
        <Modal.Title>
          {currentRole ? 'Editar Rol y Permisos' : 'Crear Nuevo Rol'}
        </Modal.Title>
      </Modal.Header>
      <BootstrapForm onSubmit={handleSubmitForm}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={onHide}>
              {/* onClose aquí podría ser onHide o una función para limpiar solo el error del modal */}
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
              placeholder="Ej: Coordinador Académico"
            />
          </BootstrapForm.Group>

          <BootstrapForm.Group className="mb-3">
            <BootstrapForm.Label>Permisos Asignados:</BootstrapForm.Label>
            {loadingPermisos ? (
              <p>Cargando lista de permisos...</p>
            ) : allPermisos.length === 0 ? (
              <p>No hay permisos disponibles para asignar.</p>
            ) : (
              <div
                className="ms-1 p-2 border rounded"
                style={{ maxHeight: '300px', overflowY: 'auto' }}
              >
                {/* Opcional: Agrupar permisos o usar columnas para mejor UI */}
                <Row>
                  {allPermisos.map((permiso) => (
                    <Col md={6} key={permiso.ID_PERMISO}>
                      {/* Mostrar en 2 columnas */}
                      <FormCheck
                        type="checkbox"
                        id={`permiso-modal-${permiso.ID_PERMISO}`}
                        label={permiso.NOMBRE_PERMISO}
                        title={
                          permiso.DESCRIPCION_PERMISO || permiso.NOMBRE_PERMISO
                        }
                        checked={formData.permisos.includes(permiso.ID_PERMISO)}
                        onChange={() => handlePermisoChange(permiso.ID_PERMISO)}
                        disabled={isProcessing}
                      />
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </BootstrapForm.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isProcessing || loadingPermisos}
          >
            {isProcessing
              ? currentRole
                ? 'Guardando Cambios...'
                : 'Creando Rol...'
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
