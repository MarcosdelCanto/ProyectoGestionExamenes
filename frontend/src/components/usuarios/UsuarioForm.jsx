import React, { useState, useEffect } from 'react';
import { getRoles } from '../../services/usuarioService';
import Select from 'react-select'; // Importar react-select
import { Spinner } from 'react-bootstrap'; // Importar Spinner para el botón de Guardar
// NO importes Modal o Button de react-bootstrap aquí, ya que el padre los maneja en el Modal.Footer.

export default function UsuarioForm({
  initial,
  onSave,
  onClose,
  isProcessing,
}) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rolId, setRolId] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [formAttempted, setFormAttempted] = useState(false);

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
    setLoadingRoles(true);
    getRoles()
      .then((data) => {
        if (Array.isArray(data)) {
          setRoles(data);
        } else {
          console.error(
            'Error: getRoles en UsuarioForm no devolvió un array:',
            data
          );
          setRoles([]);
        }
      })
      .catch((error) => {
        console.error('Error al cargar roles en UsuarioForm:', error);
        setRoles([]);
      })
      .finally(() => {
        setLoadingRoles(false);
      });
  }, []);

  useEffect(() => {
    if (initial) {
      setNombre(initial.NOMBRE_USUARIO || '');
      setEmail(initial.EMAIL_USUARIO || '');
      setRolId(initial.ROL_ID_ROL || '');
      setPassword('');
    } else {
      setNombre('');
      setEmail('');
      setRolId('');
      setPassword('');
    }
  }, [initial]);

  const submit = (e) => {
    e.preventDefault();
    setFormAttempted(true);

    if (!rolId) {
      return;
    }

    if (!initial && !password.trim()) {
      // Esta alerta de window.alert debería ser reemplazada por una modal de alerta del padre (UsuariosPage)
      // para mantener la consistencia. Por ahora, la mantengo aquí como un fallback.
      alert('La contraseña es requerida para nuevos usuarios.');
      return;
    }
    onSave({
      nombre_usuario: nombre,
      email_usuario: email,
      rol_id_rol: rolId,
      password_usuario: password.trim() || undefined,
    });
  };

  return (
    // ELIMINADO: <div className="modal show d-block" tabIndex="-1">
    // ELIMINADO: <div className="modal-dialog">
    // ELIMINADO: <div className="modal-content">
    // ELIMINADO: <div className="modal-header">...</div> (esto lo maneja el padre ahora)
    // El formulario es ahora el elemento raíz que contiene los campos y el footer.
    <form onSubmit={submit}>
      <div className="mb-3">
        <label className="form-label">Nombre</label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          disabled={isProcessing}
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
          disabled={isProcessing}
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
          isDisabled={loadingRoles || isProcessing}
          isClearable
          noOptionsMessage={() => 'No hay roles disponibles'}
        />
        {loadingRoles && (
          <small className="form-text text-muted">Cargando roles...</small>
        )}
        {formAttempted && !rolId && (
          <div className="invalid-feedback d-block">Seleccione un rol.</div>
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
          required={!initial}
          disabled={isProcessing}
        />
      </div>
      {/* El modal-footer ahora debe ser un div normal dentro del formulario. */}
      {/* La apariencia del footer (bordes, background) la gestionará el CSS de tu Modal padre. */}
      <div className="modal-footer px-0 pb-0 pt-3">
        {' '}
        {/* Añadido padding para que no quede pegado al final */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={isProcessing}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loadingRoles || isProcessing}
        >
          {isProcessing ? (
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
          ) : (
            'Guardar'
          )}
        </button>
      </div>
    </form>
  );
}
