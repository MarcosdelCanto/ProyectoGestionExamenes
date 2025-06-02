// src/hooks/usePermission.js
import { useState, useEffect, useCallback } from 'react';
// Asumimos que refreshCurrentUserPermissions actualiza localStorage y devuelve el usuario actualizado
import {
  getCurrentUser,
  refreshCurrentUserPermissions,
} from '../services/authService';

export function usePermission() {
  // Inicializa currentUser desde localStorage. getCurrentUser() debería devolver el objeto
  // completo con isAuthenticated, rol, permisos, etc.
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(true); // Inicia como true hasta que se cargue el usuario inicial

  // Función para permitir que los componentes fuercen una recarga de permisos
  // y del estado del usuario en este hook.
  const forceReloadUserData = useCallback(async () => {
    console.log(
      '[usePermission] Forzando recarga de datos del usuario y permisos...'
    );
    setLoading(true);
    try {
      const updatedUser = await refreshCurrentUserPermissions(); // Llama al servicio que actualiza localStorage
      setCurrentUser(updatedUser); // Actualiza el estado local del hook con el usuario refrescado
    } catch (error) {
      console.error(
        '[usePermission] Error durante forceReloadUserData:',
        error
      );
      // En caso de error, podríamos decidir mantener el currentUser anterior o limpiarlo
      // Por ahora, lo mantenemos para no perder el estado si la API falla temporalmente
      setCurrentUser(getCurrentUser()); // Reintentar leer de localStorage por si acaso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Al montar, simplemente establecemos el usuario que ya está en localStorage.
    // Se asume que authService.login() ya cargó los permisos y los guardó.
    const userFromStorage = getCurrentUser();
    setCurrentUser(userFromStorage);
    setLoading(false);

    // Opcional: Escuchar un evento si quieres sincronizar entre pestañas o si localStorage cambia externamente
    // const handleStorageChange = (event) => {
    //   if (event.key === 'user') {
    //     console.log('[usePermission] localStorage "user" cambió, actualizando currentUser.');
    //     setCurrentUser(getCurrentUser());
    //   }
    // };
    // window.addEventListener('storage', handleStorageChange);
    // return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // Se ejecuta solo una vez al montar para obtener el estado inicial de localStorage

  const hasPermission = (permissionName) => {
    if (loading || !currentUser || !currentUser.isAuthenticated) {
      // console.log(`[usePermission] Verificando '${permissionName}': Cargando o no autenticado. Acceso denegado.`);
      return false;
    }

    // Asumimos que currentUser.rol tiene el NOMBRE_ROL (ej: "ADMINISTRADOR")
    // o que currentUser.NOMBRE_ROL existe si 'rol' es un alias.
    // Es importante que el objeto 'user' en localStorage tenga esta propiedad consistentemente.
    if (
      currentUser.rol === 'ADMINISTRADOR' ||
      currentUser.NOMBRE_ROL === 'ADMINISTRADOR'
    ) {
      // console.log(`[usePermission] Verificando '${permissionName}': Usuario es ADMIN. Acceso concedido.`);
      return true;
    }

    // Asumimos que currentUser.permisos es un array de objetos: [{NOMBRE_PERMISO: '...'}, ...]
    // según tu implementación original. Si fetchPermisosByRol y el login ahora devuelven
    // un array de strings, esta lógica debe cambiar a: currentUser.permisos?.includes(permissionName)
    const permissionFound =
      currentUser.permisos?.some(
        (permission) => permission.NOMBRE_PERMISO === permissionName
      ) || false;

    // console.log(`[usePermission] Verificando '${permissionName}': Permisos del usuario:`, currentUser.permisos, `Resultado: ${permissionFound}`);
    return permissionFound;
  };

  // Funciones helper (están bien como las tienes)
  const canView = (resource) => hasPermission(`VIEW_${resource.toUpperCase()}`);
  const canCreate = (resource) =>
    hasPermission(`CREATE_${resource.toUpperCase()}`);
  const canEdit = (resource) => hasPermission(`EDIT_${resource.toUpperCase()}`);
  const canDelete = (resource) =>
    hasPermission(`DELETE_${resource.toUpperCase()}`);

  return {
    currentUser, // Exponer el usuario actual puede ser útil para la UI
    hasPermission,
    loading,
    forceReloadUserData, // Renombrada para mayor claridad, refresca todo el usuario
    // userPermissions: currentUser?.permisos || [], // Si necesitas la lista cruda de permisos
    canView,
    canCreate,
    canEdit,
    canDelete,
  };
}
