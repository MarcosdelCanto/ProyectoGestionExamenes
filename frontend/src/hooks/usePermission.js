import { useState, useEffect, useCallback } from 'react';
// Asumimos que refreshCurrentUserPermissions actualiza localStorage y devuelve el usuario actualizado
import {
  getCurrentUser, // Función para leer el usuario del localStorage
  refreshCurrentUserPermissions, // Función para refrescar los permisos desde el backend y actualizar localStorage
} from '../services/authService';
import { listCarrerasByUsuario } from '../services/usuarioCarreraService'; // Servicio para obtener carreras asociadas a un usuario

/**
 * Hook personalizado para gestionar los permisos y el estado del usuario actual.
 * Proporciona el objeto de usuario, funciones para verificar permisos específicos
 * y para recargar los datos del usuario.
 */
export function usePermission() {
  // Inicializa currentUser desde localStorage. getCurrentUser() debería devolver el objeto
  // completo con isAuthenticated, rol, permisos, etc., o un objeto de usuario predeterminado si no hay sesión.
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  // Estado para indicar si los datos del usuario y sus permisos están siendo cargados o refrescados.
  const [loading, setLoading] = useState(true);

  /**
   * Función para forzar una recarga completa de los datos del usuario y sus permisos
   * desde el backend, actualizando el estado del hook y el localStorage.
   * Utiliza useCallback para memoizar la función y evitar recreaciones innecesarias.
   */
  const forceReloadUserData = useCallback(async () => {
    console.log(
      '[usePermission] Forzando recarga de datos del usuario y permisos...'
    );
    setLoading(true); // Inicia el estado de carga
    try {
      // Llama al servicio para actualizar los permisos del usuario en el backend y localStorage.
      const updatedUser = await refreshCurrentUserPermissions();
      setCurrentUser(updatedUser); // Actualiza el estado local del hook con el usuario refrescado.
      console.log('[usePermission] Datos del usuario recargados:', updatedUser);
    } catch (error) {
      console.error(
        '[usePermission] Error durante forceReloadUserData:',
        error
      );
      // En caso de error, intenta leer de localStorage por si había algo válido previamente.
      setCurrentUser(getCurrentUser());
    } finally {
      setLoading(false); // Finaliza el estado de carga
    }
  }, []); // Dependencias vacías, ya que no depende de ningún valor del scope que pueda cambiar.

  /**
   * useEffect para la carga inicial de los datos del usuario y para enriquecer
   * el objeto de usuario con las carreras asociadas, si es necesario.
   * Se ejecuta solo una vez al montar el componente.
   */
  useEffect(() => {
    const loadAndEnrichUser = async () => {
      setLoading(true); // Inicia el estado de carga
      let user = getCurrentUser(); // Lee el usuario desde localStorage

      // Define los roles que deberían tener carreras asociadas.
      // Si tu backend maneja esto de forma diferente (ej. un campo `has_carreras` en el rol),
      // adapta esta lógica.
      const rolesConCarreras = [
        'JEFE CARRERA',
        'COORDINADOR CARRERA',
        'COORDINADOR DOCENTE',
      ];

      // Condición para obtener carreras:
      // 1. El usuario está autenticado.
      // 2. Su rol está entre los que tienen carreras asociadas.
      // 3. La propiedad `carrerasAsociadas` no existe o está vacía en su objeto local.
      if (
        user.isAuthenticated &&
        user.nombre_rol && // Asegurarse de que nombre_rol no sea undefined
        rolesConCarreras.includes(user.nombre_rol) &&
        (!user.carrerasAsociadas || user.carrerasAsociadas.length === 0)
      ) {
        console.log(
          '[usePermission] Datos de carrera faltantes o vacíos para rol relevante. Obteniendo desde la API...'
        );
        try {
          const carreras = await listCarrerasByUsuario(user.id_usuario);
          // Asigna las carreras obtenidas o un array vacío si no hay.
          user.carrerasAsociadas = carreras || [];
          // Guarda el objeto de usuario enriquecido en localStorage para futuras lecturas.
          localStorage.setItem('user', JSON.stringify(user));
          console.log(
            '[usePermission] Usuario enriquecido y guardado en localStorage:',
            user
          );
        } catch (error) {
          console.error(
            'Error al obtener carreras asociadas para el usuario:',
            error
          );
          user.carrerasAsociadas = []; // En caso de error, asegúrate de que sea un array vacío.
        }
      }

      // Actualiza el estado del hook con el usuario (posiblemente enriquecido).
      setCurrentUser(user);
      console.log(
        '[usePermission] Estado inicial del usuario actualizado:',
        user
      );
      setLoading(false); // Finaliza el estado de carga
    };

    loadAndEnrichUser();
  }, []); // El array de dependencias vacío asegura que se ejecute solo una vez al montar el hook.

  /**
   * Verifica si el usuario actual tiene un permiso específico.
   * @param {string} permissionName - El nombre del permiso a verificar (ej. 'VER USUARIOS').
   * @returns {boolean} - True si el usuario tiene el permiso, false en caso contrario.
   */
  const hasPermission = useCallback(
    (permissionName) => {
      // Si todavía estamos cargando o el usuario no está autenticado, no tiene permisos.
      if (loading || !currentUser || !currentUser.isAuthenticated) {
        return false;
      }

      // El administrador (o cualquier rol con control total) siempre tiene todos los permisos.
      // Se asume 'ADMINISTRADOR' es el nombre del rol con todos los privilegios.
      if (currentUser.NOMBRE_ROL === 'ADMINISTRADOR') {
        return true;
      }

      // Busca si el permiso específico existe en la lista de permisos del usuario.
      // `currentUser.permisos` debería ser un array de objetos con una propiedad `NOMBRE_PERMISO`.
      const permissionFound =
        currentUser.permisos?.some(
          (permission) => permission.NOMBRE_PERMISO === permissionName
        ) || false; // Asegura que siempre devuelva un booleano.
      return permissionFound;
    },
    [loading, currentUser]
  ); // Depende de loading y currentUser para reevaluarse.

  /**
   * Verifica si el usuario actual tiene permiso sobre una carrera específica.
   * Esto es relevante para roles que tienen acceso restringido por carrera (ej. Jefes de Carrera).
   * @param {number|string} careerId - El ID de la carrera a verificar.
   * @returns {boolean} - True si el usuario tiene permiso sobre la carrera, false en caso contrario.
   */
  const hasCareerPermission = useCallback(
    (careerId) => {
      // Si estamos cargando o el usuario no está autenticado, no tiene permiso.
      if (loading || !currentUser || !currentUser.isAuthenticated) {
        return false;
      }

      // El administrador siempre tiene permiso sobre todas las carreras.
      if (currentUser.NOMBRE_ROL === 'ADMINISTRADOR') {
        return true;
      }

      // Si el usuario no tiene una lista de carreras asociadas o está vacía, no tiene permiso.
      if (
        !currentUser.carrerasAsociadas ||
        currentUser.carrerasAsociadas.length === 0
      ) {
        return false;
      }

      // Verifica si el ID de la carrera está incluido en la lista de carreras asociadas al usuario.
      return currentUser.carrerasAsociadas.some(
        (carrera) => carrera.ID_CARRERA === careerId
      );
    },
    [loading, currentUser]
  ); // Depende de loading y currentUser para reevaluarse.

  // Funciones helper para verificar acciones comunes sobre recursos (ej. 'USUARIOS', 'CARRERAS')
  // Estas funciones construyen el nombre del permiso en el formato "ACCIÓN_RECURSO_EN_MAYÚSCULAS"
  // para que coincida con tus permisos de backend (ej. 'VER CARRERAS', 'CREAR USUARIOS').
  const canView = useCallback(
    (resource) => hasPermission(`VIEW_${resource.toUpperCase()}`),
    [hasPermission]
  );
  const canCreate = useCallback(
    (resource) => hasPermission(`CREATE_${resource.toUpperCase()}`),
    [hasPermission]
  );
  const canEdit = useCallback(
    (resource) => hasPermission(`EDIT_${resource.toUpperCase()}`),
    [hasPermission]
  );
  const canDelete = useCallback(
    (resource) => hasPermission(`DELETE_${resource.toUpperCase()}`),
    [hasPermission]
  );

  // Retorna el estado y las funciones del hook para ser utilizadas por los componentes.
  return {
    currentUser, // Objeto de usuario actual (puede estar enriquecido con carreras)
    loading, // Estado de carga
    hasPermission, // Función para verificar permisos generales
    hasCareerPermission, // Función para verificar permisos sobre carreras específicas
    forceReloadUserData, // Función para forzar una recarga de datos del usuario
    canView, // Helper para verificar permiso de vista
    canCreate, // Helper para verificar permiso de creación
    canEdit, // Helper para verificar permiso de edición
    canDelete, // Helper para verificar permiso de eliminación
  };
}
