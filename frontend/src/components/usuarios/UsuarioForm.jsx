import React, { useState, useEffect } from 'react';
import { getRoles } from '../../services/usuarioService';
import Select from 'react-select'; // Importar react-select

export default function UsuarioForm({ initial, onSave, onClose }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rolId, setRolId] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [formAttempted, setFormAttempted] = useState(false); // Nuevo estado para rastrear el intento de envío

  // Helper para convertir roles a formato de opciones para react-select
  const toRoleSelectOptions = (rolesData) => {
    if (!Array.isArray(rolesData)) return [];
    return rolesData.map((role) => ({
      value: role.ID_ROL,
      label: role.NOMBRE_ROL,
    }));
  };

  const roleOptions = toRoleSelectOptions(roles);
  const selectedRoleOption =
    roleOptions.find((option) => option.value === rolId) || null;

  useEffect(() => {
    // Cargar roles cuando el componente se monta
    setLoadingRoles(true);
    getRoles()
      .then((data) => {
        if (Array.isArray(data)) {
          setRoles(data);
        } else {
          console.error(
            'Error: getRoles en UsuarioForm no devolvió un array. Recibido:',
            data
          );
          setRoles([]); // Asegurar que roles sea un array
        }
      })
      .catch((error) => {
        console.error('Error al cargar roles en UsuarioForm:', error);
        setRoles([]); // En caso de error, establecer roles a un array vacío
      })
      .finally(() => {
        setLoadingRoles(false);
      });
  }, []); // Se ejecuta solo una vez cuando el componente se monta

  useEffect(() => {
    // Sincronizar el estado del formulario con `initial`
    if (initial) {
      setNombre(initial.NOMBRE_USUARIO || '');
      setEmail(initial.EMAIL_USUARIO || '');
      setRolId(initial.ROL_ID_ROL || '');
      setPassword(''); // Limpiar campo de contraseña para edición, se ingresa solo si se quiere cambiar
    } else {
      // Es un formulario para nuevo usuario, asegurar campos limpios
      setNombre('');
      setEmail('');
      setRolId('');
      setPassword('');
    }
  }, [initial]); // Se ejecuta cuando `initial` cambia (y al montar si initial está presente)

  const submit = (e) => {
    e.preventDefault();
    setFormAttempted(true); // Marcar que se intentó enviar el formulario

    // Validar que el rol esté seleccionado
    if (!rolId) {
      // El mensaje visual se mostrará debido a formAttempted y !rolId
      return;
    }

    if (!initial && !password.trim()) {
      alert('La contraseña es requerida para nuevos usuarios.');
      return;
    }
    onSave({ nombre, email, rolId, password: password.trim() || undefined });
  };
  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog">
        <form onSubmit={submit}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {initial ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-control"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Rol</label>
                <Select
                  inputId="rol-select"
                  options={roleOptions}
                  value={selectedRoleOption}
                  onChange={(selectedOption) =>
                    setRolId(selectedOption ? selectedOption.value : '')
                  }
                  placeholder="-- Selecciona --"
                  isLoading={loadingRoles}
                  isDisabled={loadingRoles}
                  isClearable
                  noOptionsMessage={() => 'No hay roles disponibles'}
                  // `required` no es una prop directa de react-select,
                  // la validación se maneja en el submit o con el estado rolId
                />
                {/* Para la validación 'required', puedes mostrar un mensaje si rolId está vacío al intentar enviar */}
                {loadingRoles && (
                  <small className="form-text text-muted">
                    Cargando roles...
                  </small>
                )}
                {/* Mostrar mensaje de error si el rol no está seleccionado y se intentó enviar */}
                {formAttempted && !rolId && (
                  <div className="invalid-feedback d-block">
                    Seleccione un rol.
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">
                  {initial ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={initial ? 'Dejar vacío para no cambiar' : ''}
                  required={!initial} // Requerido solo si es nuevo usuario
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loadingRoles}
              >
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
