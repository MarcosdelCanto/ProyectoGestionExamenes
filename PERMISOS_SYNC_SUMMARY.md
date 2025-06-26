# Sincronización de Permisos Frontend-Backend

## Resumen de Cambios Realizados

Este documento resume los cambios realizados para sincronizar el hook `usePermission` del frontend con la lógica y estructura de permisos del backend.

## Problema Identificado

El hook `usePermission.js` utilizaba nombres de permisos en inglés y en formato diferente al backend:

- Frontend: `view_users`, `create_users`, etc.
- Backend: `VER USUARIOS`, `CREAR USUARIOS`, etc.

## Cambios Implementados

### 1. Backend - Nuevo Endpoint de Permisos

**Archivo**: `backend/controllers/user.controller.js`

- ✅ Agregada función `getMyPermissions()` que retorna los permisos del usuario autenticado según su rol

**Archivo**: `backend/routes/user.routes.js`

- ✅ Agregada ruta `GET /api/usuarios/my-permissions` para exponer el endpoint

### 2. Frontend - Servicio de Autenticación Mejorado

**Archivo**: `frontend/src/services/authService.js`

- ✅ Agregada función `fetchMyPermissions()` que llama al nuevo endpoint
- ✅ Agregada función `refreshCurrentUserPermissionsImproved()` que usa el nuevo endpoint más robusto

### 3. Frontend - Hook usePermission Actualizado

**Archivo**: `frontend/src/hooks/usePermission.js`

- ✅ Helpers `canView`, `canCreate`, `canEdit`, `canDelete` ahora usan formato correcto del backend:
  - `canView('usuarios')` → busca permiso `VER USUARIOS`
  - `canCreate('usuarios')` → busca permiso `CREAR USUARIOS`
  - `canEdit('usuarios')` → busca permiso `EDITAR USUARIOS`
  - `canDelete('usuarios')` → busca permiso `ELIMINAR USUARIOS`
- ✅ Comparación de roles ahora usa `nombre_rol` en lugar de `NOMBRE_ROL`
- ✅ Se importa y usa `refreshCurrentUserPermissionsImproved()` en lugar de la función anterior
- ✅ Comentarios actualizados para mayor claridad

## Formato de Permisos Estandarizado

### Backend (Base de Datos)

Los permisos en la base de datos usan el formato:

```
[ACCIÓN] [RECURSO]
```

Ejemplos:

- `VER USUARIOS`
- `CREAR USUARIOS`
- `EDITAR USUARIOS`
- `ELIMINAR USUARIOS`
- `VER ROLES`
- `CREAR ROLES`
- `EDITAR ROLES`
- `ELIMINAR ROLES`

### Frontend (Uso en Componentes)

Los helpers del hook se usan pasando el recurso en minúsculas:

```javascript
const { canView, canCreate, canEdit, canDelete } = usePermission();

// Uso correcto:
canView("usuarios"); // Verifica permiso "VER USUARIOS"
canCreate("roles"); // Verifica permiso "CREAR ROLES"
canEdit("salas"); // Verifica permiso "EDITAR SALAS"
canDelete("examenes"); // Verifica permiso "ELIMINAR EXAMENES"
```

## Flujo de Obtención de Permisos Mejorado

### Flujo Anterior

1. `fetchPermisosByRol(rol_id)` - Requería conocer el ID del rol
2. Potenciales inconsistencias si el rol del usuario cambiaba

### Flujo Nuevo (Mejorado)

1. `fetchMyPermissions()` - Usa el token del usuario autenticado
2. El backend determina automáticamente los permisos según el rol actual
3. Más robusto y seguro

## Compatibilidad

Los cambios son **backward compatible** con el uso actual del hook. Los componentes existentes que usan `canView('usuarios')`, `canEdit('roles')`, etc., seguirán funcionando sin modificaciones.

## Pendientes para Verificación

1. **Pruebas en la aplicación**: Verificar que los permisos se reflejan correctamente tras login/cambio de rol
2. **Limpieza opcional**: Eliminar la función `refreshCurrentUserPermissions` original si ya no es usada en otros lugares
3. **Documentación**: Actualizar documentación del desarrollador si existe

## Archivos Modificados

- ✅ `frontend/src/hooks/usePermission.js`
- ✅ `frontend/src/services/authService.js`
- ✅ `backend/controllers/user.controller.js`
- ✅ `backend/routes/user.routes.js`

## Beneficios de los Cambios

1. **Consistencia**: Nombres de permisos uniformes entre frontend y backend
2. **Robustez**: Endpoint específico para permisos del usuario autenticado
3. **Seguridad**: No requiere pasar IDs de rol externamente
4. **Mantenibilidad**: Código más claro y fácil de entender
5. **Escalabilidad**: Fácil agregar nuevos permisos siguiendo la convención establecida
