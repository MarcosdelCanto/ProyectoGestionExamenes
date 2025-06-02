// src/components/Layout.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout as authLogout } from '../services/authService'; // Asegúrate que la ruta sea correcta
import { usePermission } from '../hooks/usePermission'; // Asegúrate que la ruta sea correcta

export default function Layout({ children }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  // Utilizamos el hook para obtener los permisos.
  // Asumimos que este hook funciona y 'hasPermission' devuelve true/false correctamente.
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
          ☰ {/* Ícono de Menú Hamburguesa */}
        </button>
        <img
          src="/images/logoduoc.svg.png" // Asegúrate que esta imagen exista en tu carpeta public/images
          alt="Logo Institucional"
          className="me-3"
          style={{ height: '50px' }}
        />
      </header>

      {/* Main Content Area */}
      <main className="flex-grow-1 p-4 bg-light overflow-auto">{children}</main>

      {/* Sidebar (Offcanvas) */}
      <div
        className="offcanvas offcanvas-start bg-light"
        tabIndex="-1"
        id="offcanvasSidebar"
        aria-labelledby="offcanvasSidebarLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="offcanvasSidebarLabel">
            Menú Principal
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas" // Cierra el offcanvas
            aria-label="Cerrar"
          ></button>
        </div>
        <div className="offcanvas-body p-3 d-flex flex-column">
          <nav className="nav flex-column mb-auto">
            {/* Enlace General */}
            <Link to="/" className="nav-link fw-bold text-dark">
              Inicio
            </Link>
            {/*// Podría ir después de Inicio o en una sección relevante */}
            <Link to="/mis-reservas" className="nav-link text-dark">
              Mis Exámenes Programados
            </Link>
            {/* Enlaces Condicionales por Permiso */}
            {hasPermission('VIEW_CALENDARIO') && (
              <Link to="/calendario" className="nav-link text-dark">
                Calendario
              </Link>
            )}
            {hasPermission('VIEW_EXAMENES') && ( // Para la página de gestión de exámenes
              <Link to="/examen" className="nav-link text-dark">
                Gestión de Exámenes
              </Link>
            )}
            {/* Permiso para la nueva funcionalidad de crear reserva */}
            {hasPermission('CREATE_RESERVAS_EXAMEN') && (
              <Link to="/reservas/crear" className="nav-link text-dark">
                Crear Reserva para Examen
              </Link>
            )}
            {/* Permiso para que el docente vea sus reservas pendientes */}
            {/* (Asumimos que 'DOCENTE_VIEW_RESERVAS_PENDIENTES' es el nombre del permiso en tu DB) */}
            {hasPermission('DOCENTE_VIEW_RESERVAS_PENDIENTES') && (
              <Link
                to="/reserva/docente/pendientes"
                className="nav-link text-dark"
              >
                Mis Reservas Pendientes
              </Link>
            )}
            {hasPermission('VIEW_SALAS') && (
              <Link to="/salas" className="nav-link text-dark">
                Gestión de Salas
              </Link>
            )}
            {hasPermission('VIEW_ASIGNATURAS') && (
              <Link to="/asignaturas" className="nav-link text-dark">
                Gestión de Asignaturas
              </Link>
            )}
            {hasPermission('VIEW_MODULOS') && (
              <Link to="/modulos" className="nav-link text-dark">
                Gestión de Módulos
              </Link>
            )}
            {hasPermission('VIEW_USUARIOS') && (
              <Link to="/usuarios" className="nav-link text-dark">
                Gestión de Usuarios
              </Link>
            )}
            {hasPermission('VIEW_CARGA_DATOS') && (
              <Link to="/carga-datos" className="nav-link text-dark">
                Carga de Datos Masiva
              </Link>
            )}
            {hasPermission('VIEW_ROLES') && (
              <Link to="/roles" className="nav-link text-dark">
                Gestión de Roles y Permisos
              </Link>
            )}
            {/* Permiso para la sección de reportes */}
            {/* (Asumimos que 'VIEW_REPORTES' es el nombre del permiso en tu DB si decidiste protegerlo) */}
            {hasPermission('VIEW_REPORTES') && (
              <Link to="/reportes" className="nav-link fw-bold text-dark">
                Reportes
              </Link>
            )}
          </nav>

          {/* Botón de Cerrar Sesión */}
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
