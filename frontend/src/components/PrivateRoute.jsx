// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { usePermission } from '../hooks/usePermission';

const PrivateRoute = ({ allowedRoles, requiredPermissions }) => {
  const currentUser = getCurrentUser();
  const location = useLocation();
  const { hasPermission, loading } = usePermission();

  // Si está cargando permisos y los necesitamos, mostrar indicador
  if (loading && requiredPermissions) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando permisos...</span>
        </div>
      </div>
    );
  }

  // Verificar autenticación
  if (!currentUser || !currentUser.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar roles si es necesario
  if (allowedRoles && !allowedRoles.includes(currentUser.rol)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // Verificar permisos si es necesario
  if (requiredPermissions && requiredPermissions.length > 0) {
    // Verifica que el usuario tenga al menos uno de los permisos requeridos
    const hasAnyRequiredPermission = requiredPermissions.some((permission) =>
      hasPermission(permission)
    );

    if (!hasAnyRequiredPermission) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  // Si todas las comprobaciones pasan, renderizar el contenido
  return <Outlet />;
};

export default PrivateRoute;
