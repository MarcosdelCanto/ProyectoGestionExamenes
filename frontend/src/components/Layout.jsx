import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout as authLogout } from '../services/authService';
import { usePermission } from '../hooks/usePermission';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  // Utilizamos el hook para obtener los permisos desde la BBDD
  const { hasPermission, loading } = usePermission();

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando permisos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column w-100" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header
        className="d-flex justify-content-between align-items-center px-4 py-2 border-bottom bg-white shadow-sm"
        style={{ height: '80px' }}
      >
        <button
          className="btn btn-outline-primary"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasSidebar"
          aria-controls="offcanvasSidebar"
        >
          ☰
        </button>
        <img
          src="/images/logoduoc.svg.png"
          alt="Logo Institucional"
          className="me-3"
          style={{ height: '50px' }}
        />
      </header>

      {/* Main Content */}
      <main className="flex-grow-1 p-4 bg-light overflow-auto">{children}</main>

      {/* Sidebar: Offcanvas para todas las pantallas */}
      <div
        className="offcanvas offcanvas-start bg-light"
        tabIndex="-1"
        id="offcanvasSidebar"
        aria-labelledby="offcanvasSidebarLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="offcanvasSidebarLabel">
            Menú
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Cerrar"
          ></button>
        </div>
        <div className="offcanvas-body p-3 d-flex flex-column">
          <nav className="nav flex-column mb-auto">
            {/* Enlaces accesibles para cualquier usuario autenticado */}
            <Link to="/" className="nav-link fw-bold text-dark">
              Inicio
            </Link>

            {/* Links que aparecen según los permisos cargados desde la BBDD */}
            {hasPermission('VIEW_CALENDARIO') && (
              <Link to="/calendario" className="nav-link text-dark">
                Calendario
              </Link>
            )}

            {hasPermission('VIEW_EXAMENES') && (
              <Link to="/examenes" className="nav-link text-dark">
                Exámenes
              </Link>
            )}

            {hasPermission('VIEW_SALAS') && (
              <Link to="/salas" className="nav-link text-dark">
                Salas
              </Link>
            )}

            {hasPermission('VIEW_ASIGNATURAS') && (
              <Link to="/asignaturas" className="nav-link text-dark">
                Asignaturas
              </Link>
            )}

            {hasPermission('VIEW_MODULOS') && (
              <Link to="/modulos" className="nav-link text-dark">
                Módulos
              </Link>
            )}

            {hasPermission('VIEW_USUARIOS') && (
              <Link to="/usuarios" className="nav-link text-dark">
                Usuarios
              </Link>
            )}

            {hasPermission('VIEW_CARGA_DATOS') && (
              <Link to="/carga-datos" className="nav-link text-dark">
                Carga de datos
              </Link>
            )}

            {hasPermission('VIEW_ROLES') && (
              <Link to="/roles" className="nav-link text-dark">
                Gestión de Roles
              </Link>
            )}
          </nav>
          <div className="mt-auto">
            <button className="btn btn-danger w-100" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
