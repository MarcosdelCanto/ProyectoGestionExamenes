// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../services/authService'; // Importamos getCurrentUser

const PrivateRoute = ({ allowedRoles }) => {
  const currentUser = getCurrentUser();
  const location = useLocation();

  if (!currentUser.isAuthenticated) {
    // Redirige a la página de login, guardando la ubicación actual
    // para que puedan ser redirigidos de vuelta después de iniciar sesión.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si se especifican roles permitidos y el rol del usuario no está incluido
  if (allowedRoles && !allowedRoles.includes(currentUser.rol)) {
    // El usuario está autenticado pero no tiene el rol requerido.
    // Redirige a una página de "No Autorizado".
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // Si está autenticado y (no se requieren roles específicos O el usuario tiene el rol requerido)
  // Renderiza el componente/ruta hijo.
  return <Outlet />;
};

export default PrivateRoute;
