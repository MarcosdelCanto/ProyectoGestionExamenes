// frontend/src/components/roles/RoleForm.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react'; // Agregado useRef
import {
  Modal,
  Button,
  Form as BootstrapForm,
  Alert,
  FormCheck,
  Row,
  Col,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import { fetchAllPermisos } from '../../services/permisoService'; // Tu servicio real

// Componente para manejar el estado indeterminado del checkbox
// Este componente se define aquí mismo o puede estar en un archivo de utilidades si lo usas en varios lugares.
const IndeterminateCheckbox = ({ indeterminate, ...rest }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [ref, indeterminate]);

  return <input type="checkbox" ref={ref} {...rest} />;
};

function RoleForm({
  show,
  onHide,
  onSubmit,
  currentRole,
  isProcessing,
  error,
}) {
  const [formData, setFormData] = useState({
    NOMBRE_ROL: '',
    permisos: [], // Array de IDs de permisos seleccionados
  });
  const [allPermisos, setAllPermisos] = useState([]);
  const [loadingPermisos, setLoadingPermisos] = useState(false);

  useEffect(() => {
    if (show) {
      const loadAllAvailablePermisos = async () => {
        setLoadingPermisos(true);
        try {
          // Usa tu servicio real fetchAllPermisos
          const permisosDisponibles = await fetchAllPermisos();
          setAllPermisos(permisosDisponibles || []);
        } catch (err) {
          console.error('Error al cargar la lista de todos los permisos:', err);
          setAllPermisos([]);
        } finally {
          setLoadingPermisos(false);
        }
      };

      loadAllAvailablePermisos();

      if (currentRole) {
        setFormData({
          NOMBRE_ROL: currentRole.NOMBRE_ROL || '',
          permisos: currentRole.permisos
            ? currentRole.permisos.map((p) => p.ID_PERMISO)
            : [],
        });
      } else {
        setFormData({ NOMBRE_ROL: '', permisos: [] });
      }
    }
  }, [currentRole, show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handlePermisoChange = (idPermiso) => {
    setFormData((prev) => ({
      ...prev,
      permisos: prev.permisos.includes(idPermiso)
        ? prev.permisos.filter((id) => id !== idPermiso)
        : [...prev.permisos, idPermiso],
    }));
  };

  const groupedPermissions = useMemo(() => {
    const groups = {};
    allPermisos.forEach((permiso) => {
      const groupName = permiso.GRUPO_PERMISO || 'OTROS';

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(permiso);
    });

    const sortedGroupKeys = Object.keys(groups).sort();

    const sortedGroups = {};
    sortedGroupKeys.forEach((key) => {
      sortedGroups[key] = groups[key].sort((a, b) =>
        a.NOMBRE_PERMISO.localeCompare(b.NOMBRE_PERMISO)
      );
    });

    return sortedGroups;
  }, [allPermisos]);

  const handleToggleGroup = (entity, isChecked) => {
    setFormData((prev) => {
      const newPermisos = new Set(prev.permisos);
      const permisosInGroup = groupedPermissions[entity].map(
        (p) => p.ID_PERMISO
      );

      if (isChecked) {
        permisosInGroup.forEach((id) => newPermisos.add(id));
      } else {
        permisosInGroup.forEach((id) => newPermisos.delete(id));
      }
      return { ...prev, permisos: Array.from(newPermisos) };
    });
  };

  const getGroupCheckboxState = (entity) => {
    const permisosInGroup = groupedPermissions[entity];
    const selectedPermisosInGroup = permisosInGroup.filter((p) =>
      formData.permisos.includes(p.ID_PERMISO)
    );

    if (selectedPermisosInGroup.length === 0) {
      return { checked: false, indeterminate: false };
    }
    if (selectedPermisosInGroup.length === permisosInGroup.length) {
      return { checked: true, indeterminate: false };
    }
    return { checked: false, indeterminate: true };
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {currentRole ? 'Editar Rol y Permisos' : 'Crear Nuevo Rol'}
        </Modal.Title>
      </Modal.Header>
      <BootstrapForm onSubmit={handleSubmitForm}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={onHide}>
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
              onChange={(e) =>
                setFormData({ ...formData, NOMBRE_ROL: e.target.value })
              }
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
              <div className="permissions-container border rounded p-2">
                {Object.entries(groupedPermissions).map(
                  ([entity, permisos], index) => {
                    const { checked, indeterminate } =
                      getGroupCheckboxState(entity);
                    const isLastGroup =
                      index === Object.keys(groupedPermissions).length - 1;

                    return (
                      <div
                        key={entity}
                        // Usamos un div con clases de estilo para el grupo
                        // Eliminamos Row y Col md={4} / md={8} en este nivel para usar una grilla CSS más simple
                        className={`permission-group-row d-flex align-items-start py-2 ${
                          !isLastGroup ? 'group-separator-line' : ''
                        }`}
                      >
                        {/* Columna del nombre del grupo y checkbox "seleccionar todo" */}
                        <div className="group-name-col fw-bold me-3">
                          <IndeterminateCheckbox // Usamos el componente personalizado
                            id={`group-checkbox-${entity}`}
                            checked={checked}
                            indeterminate={indeterminate}
                            onChange={(e) =>
                              handleToggleGroup(entity, e.target.checked)
                            }
                            disabled={isProcessing}
                            className="form-check-input me-2"
                          />
                          <label
                            htmlFor={`group-checkbox-${entity}`}
                            className="form-check-label"
                            // Formatea el nombre del grupo
                          >
                            {entity
                              .replace(/_/g, ' ')
                              .split(' ')
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() +
                                  word.slice(1).toLowerCase()
                              )
                              .join(' ')}
                          </label>
                        </div>

                        {/* Columna de permisos individuales */}
                        <div className="individual-permissions-col flex-grow-1">
                          {/* Esta es la grilla para los checkboxes individuales */}
                          <Row xs={1} sm={2} md={3} className="g-1">
                            {permisos.map((permiso) => (
                              <Col key={permiso.ID_PERMISO}>
                                <OverlayTrigger
                                  placement="right"
                                  delay={{ show: 250, hide: 400 }}
                                  overlay={
                                    <Tooltip
                                      id={`tooltip-${permiso.ID_PERMISO}`}
                                    >
                                      {permiso.DESCRIPCION_PERMISO ||
                                        'Sin descripción.'}
                                    </Tooltip>
                                  }
                                >
                                  <FormCheck
                                    type="checkbox"
                                    id={`permiso-modal-${permiso.ID_PERMISO}`}
                                    label={
                                      // Formatea el nombre del permiso
                                      permiso.NOMBRE_PERMISO.replace(/_/g, ' ')
                                    }
                                    checked={formData.permisos.includes(
                                      permiso.ID_PERMISO
                                    )}
                                    onChange={() =>
                                      handlePermisoChange(permiso.ID_PERMISO)
                                    }
                                    disabled={isProcessing}
                                    // Clase para el estilo del checkbox individual
                                    className="individual-permission-check"
                                  />
                                </OverlayTrigger>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      </div>
                    );
                  }
                )}
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
