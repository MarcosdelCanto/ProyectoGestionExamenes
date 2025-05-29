import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import { fetchPermisosByRol } from '../services/permisoService';

export function usePermission() {
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  // IMPORTANTE: Usamos useEffect para obtener el usuario actual solo al montar el componente
  // en lugar de obtenerlo cada vez que el componente se renderiza
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  useEffect(() => {
    // Flag para evitar actualizar el estado si el componente se desmonta
    let isMounted = true;

    const loadUserPermissions = async () => {
      // Si ya tenemos permisos almacenados en el usuario, úsalos
      if (currentUser && currentUser.isAuthenticated) {
        if (currentUser.permisos) {
          //console.log('Usando permisos almacenados:', currentUser.permisos);
          if (isMounted) {
            setUserPermissions(currentUser.permisos);
            setLoading(false);
          }
          return;
        }

        // Verificar ID del rol
        const idRol = currentUser.rol_id_rol || currentUser.ROL_ID_ROL;

        // Si no hay permisos almacenados pero tenemos ID del rol, cargarlos
        if (idRol) {
          try {
            console.log('Cargando permisos para el rol:', idRol);
            const permisos = await fetchPermisosByRol(idRol);

            // Solo almacenamos en localStorage, NO ACTUALIZAMOS currentUser
            const updatedUser = {
              ...currentUser,
              permisos,
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Importante: solo actualizar el estado si el componente sigue montado
            if (isMounted) {
              setUserPermissions(permisos);
            }
          } catch (error) {
            console.error('Error al cargar permisos del usuario:', error);
            if (isMounted) {
              setUserPermissions([]);
            }
          }
        } else {
          console.warn('Usuario autenticado pero sin rol_id_rol:', currentUser);

          // Caso especial: para administrador, podemos asignar manualmente un rol_id
          if (currentUser.rol === 'ADMINISTRADOR') {
            try {
              console.log(
                'Usuario es ADMINISTRADOR, intentando cargar permisos con ID 1'
              );
              const permisos = await fetchPermisosByRol(1); // Asumimos que el admin tiene ID 1

              if (isMounted) {
                setUserPermissions(permisos);
              }
            } catch (error) {
              console.error(
                'Error al cargar permisos para administrador:',
                error
              );
              if (isMounted) {
                setUserPermissions([]);
              }
            }
          } else {
            if (isMounted) {
              setUserPermissions([]);
            }
          }
        }
      } else {
        console.log('Usuario no autenticado');
        if (isMounted) {
          setUserPermissions([]);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    loadUserPermissions();

    // Limpieza para evitar actualizar estados en componentes desmontados
    return () => {
      isMounted = false;
    };
  }, []); // ¡IMPORTANTE! Dependencias vacías para que solo se ejecute al montar

  // Verificamos si el usuario tiene un permiso específico
  const hasPermission = (permissionName) => {
    if (!currentUser || !currentUser.isAuthenticated) return false;

    // Verificar si es administrador (acceso total)
    if (currentUser.rol === 'ADMINISTRADOR') return true;

    // Verificar si el permiso específico existe en los permisos del usuario
    return userPermissions.some(
      (permission) => permission.NOMBRE_PERMISO === permissionName
    );
  };

  // Funciones helper para verificaciones comunes
  const canView = (resource) => hasPermission(`VIEW_${resource.toUpperCase()}`);
  const canCreate = (resource) =>
    hasPermission(`CREATE_${resource.toUpperCase()}`);
  const canEdit = (resource) => hasPermission(`EDIT_${resource.toUpperCase()}`);
  const canDelete = (resource) =>
    hasPermission(`DELETE_${resource.toUpperCase()}`);

  return {
    userPermissions,
    hasPermission,
    loading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  };
}
