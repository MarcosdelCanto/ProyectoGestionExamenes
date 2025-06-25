// src/hooks/usePermission.js
import { useState, useEffect, useCallback } from 'react';
// Asumimos que refreshCurrentUserPermissions actualiza localStorage y devuelve el usuario actualizado
import {
  getCurrentUser,
  refreshCurrentUserPermissions,
} from '../services/authService';
import { listCarrerasByUsuario } from '../services/usuarioCarreraService';

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
      setCurrentUser(getCurrentUser()); // Reintentar leer de localStorage por si acaso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadAndEnrichUser = async () => {
      setLoading(true);
      let user = getCurrentUser(); // Lee el usuario desde localStorage

      // Roles que deberían tener carreras asociadas
      const rolesConCarreras = [
        'JEFE CARRERA',
        'COORDINADOR CARRERA',
        'COORDINADOR DOCENTE',
      ];

      // Condición: Si el usuario está autenticado, tiene un rol relevante
      // Y (muy importante) la propiedad `carrerasAsociadas` no existe en su objeto.
      if (
        user.isAuthenticated &&
        rolesConCarreras.includes(user.nombre_rol) &&
        (!user.carrerasAsociadas || user.carrerasAsociadas.length === 0)
      ) {
        console.log(
          '[usePermission] Datos de carrera faltantes o vacíos. Obteniendo desde la API...'
        );
        try {
          const carreras = await listCarrerasByUsuario(user.id_usuario);
          user.carrerasAsociadas = carreras || [];
          localStorage.setItem('user', JSON.stringify(user));
          console.log(
            '[usePermission] Usuario enriquecido y guardado en localStorage:',
            user
          );
        } catch (error) {
          console.error(
            'Error al obtener carreras asociadas en el hook:',
            error
          );
          user.carrerasAsociadas = [];
        }
      }

      // Actualiza el estado del hook con el usuario (posiblemente enriquecido)
      setCurrentUser(user);
      console.log('[usePermission] Estado del usuario actualizado:', user);
      setLoading(false);
    };

    loadAndEnrichUser();
  }, []); // Este array vacío asegura que se ejecute solo una vez cuando el hook se monta
  const hasPermission = (permissionName) => {
    if (loading || !currentUser || !currentUser.isAuthenticated) {
      return false;
    }
    if (
      currentUser.rol === 'ADMINISTRADOR' ||
      currentUser.NOMBRE_ROL === 'ADMINISTRADOR'
    ) {
      return true;
    }

    const permissionFound =
      currentUser.permisos?.some(
        (permission) => permission.NOMBRE_PERMISO === permissionName
      ) || false;
    return permissionFound;
  };
  const hasCareerPermission = (careerId) => {
    if (loading || !currentUser || !currentUser.isAuthenticated) {
      return false;
    }
    // El administrador siempre tiene permiso
    if (currentUser.NOMBRE_ROL === 'ADMINISTRADOR') {
      return true;
    }
    // Si el usuario no tiene carreras asociadas, no tiene permiso
    if (
      !currentUser.carrerasAsociadas ||
      currentUser.carrerasAsociadas.length === 0
    ) {
      return false;
    }
    // Verificar si el ID de la carrera del examen está en la lista de carreras del usuario
    return currentUser.carrerasAsociadas.some((c) => c.ID_CARRERA === careerId);
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
    hasCareerPermission, // Permite verificar permisos por carrera
    loading,
    forceReloadUserData, // Renombrada para mayor claridad, refresca todo el usuario
    // userPermissions: currentUser?.permisos || [], // Si necesitas la lista cruda de permisos
    canView,
    canCreate,
    canEdit,
    canDelete,
  };
}
