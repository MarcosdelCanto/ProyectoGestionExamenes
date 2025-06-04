// src/components/Layout.jsx
import React, { useEffect, useRef } from 'react'; // Importa useRef y useEffect
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Importa useLocation
import { getCurrentUser, logout as authLogout } from '../services/authService'; // Asegúrate que la ruta sea correcta
import { usePermission } from '../hooks/usePermission'; // Asegúrate que la ruta sea correcta
import { Offcanvas } from 'bootstrap'; // Importa Offcanvas de Bootstrap

export default function Layout({ children }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  // Utilizamos el hook para obtener los permisos.
  // Asumimos que este hook funciona y 'hasPermission' devuelve true/false correctamente.
  const { hasPermission, loading } = usePermission();
  const location = useLocation(); // Hook para obtener la ubicación actual (ruta)
  const offcanvasRef = useRef(null); // Ref para el elemento Offcanvas
  const offcanvasInstanceRef = useRef(null); // Ref para la instancia de Bootstrap Offcanvas

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  // Inicializar la instancia de Offcanvas de Bootstrap cuando el componente se monta
  useEffect(() => {
    if (offcanvasRef.current) {
      offcanvasInstanceRef.current = new Offcanvas(offcanvasRef.current);
    }

    // Función de limpieza para destruir la instancia de Offcanvas cuando el componente se desmonta
    return () => {
      if (offcanvasInstanceRef.current) {
        // Intenta usar el método dispose de Bootstrap si está disponible
        if (typeof offcanvasInstanceRef.current.dispose === 'function') {
          offcanvasInstanceRef.current.dispose();
        }
        // Como fallback, asegúrate de que el overflow del body se resetee
        if (document.body.style.overflow === 'hidden') {
          document.body.style.overflow = '';
          document.body.style.paddingRight = ''; // Bootstrap también puede añadir padding
        }
      }
    };
  }, []); // El array vacío asegura que esto se ejecute solo al montar y desmontar

  // Efecto para cerrar el Offcanvas cuando cambia la ruta
  useEffect(() => {
    if (offcanvasInstanceRef.current && offcanvasInstanceRef.current._isShown) {
      offcanvasInstanceRef.current.hide();
    }
    // Fallback adicional por si Bootstrap no limpia el overflow correctamente en todas las navegaciones SPA
    // Un pequeño delay puede ayudar si el JS de Bootstrap aún se está ejecutando.
    const timeoutId = setTimeout(() => {
      if (
        document.body.style.overflow === 'hidden' &&
        (!offcanvasInstanceRef.current ||
          !offcanvasInstanceRef.current._isShown)
      ) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = ''; // Bootstrap también puede añadir padding
      }
    }, 0);
    return () => clearTimeout(timeoutId); // Limpiar el timeout si el componente se desmonta o el efecto se re-ejecuta
  }, [location.pathname]); // Este efecto se ejecuta cada vez que cambia el pathname

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
        ref={offcanvasRef} // Asigna la ref al div del Offcanvas
        className="offcanvas offcanvas-start bg-light"
        tabIndex="-1"
        id="offcanvasSidebar" // Este ID es el que usa data-bs-target
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
            <Link
              to="/"
              className="nav-link fw-bold text-dark d-flex align-items-center"
            >
              <i className="bi bi-house-door-fill me-2"></i>Inicio
            </Link>
            {/*// Podría ir después de Inicio o en una sección relevante */}
            <Link
              to="/mis-reservas"
              className="nav-link text-dark d-flex align-items-center"
            >
              <i className="bi bi-calendar-check-fill me-2"></i>Mis Exámenes
              Programados
            </Link>
            {/* Enlaces Condicionales por Permiso */}
            {hasPermission('VIEW_CALENDARIO') && (
              <Link
                to="/calendario"
                className="nav-link text-dark d-flex align-items-center"
              >
                <i className="bi bi-calendar3 me-2"></i>Calendario
              </Link>
            )}
            {hasPermission('VIEW_EXAMENES') && ( // Para la página de gestión de exámenes
              <Link
                to="/examen"
                className="nav-link text-dark d-flex align-items-center"
              >
                <i className="bi bi-file-earmark-text-fill me-2"></i>Gestión de
                Exámenes
              </Link>
            )}
            {/* Permiso para la nueva funcionalidad de crear reserva */}
            {hasPermission('CREATE_RESERVAS_EXAMEN') && (
              <Link
                to="/reservas/crear"
                className="nav-link text-dark d-flex align-items-center"
              >
                <i className="bi bi-calendar-plus-fill me-2"></i>Crear Reserva
                para Examen
              </Link>
            )}
            {/* Permiso para que el docente vea sus reservas pendientes */}
            {/* (Asumimos que 'DOCENTE_VIEW_RESERVAS_PENDIENTES' es el nombre del permiso en tu DB) */}
            {hasPermission('DOCENTE_VIEW_RESERVAS_PENDIENTES') && (
              <Link
                to="/reserva/docente/pendientes"
                className="nav-link text-dark d-flex align-items-center"
              >
                <i className="bi bi-calendar-event-fill me-2"></i>Mis Reservas
                Pendientes
              </Link>
            )}
            {hasPermission('VIEW_SALAS') && (
              <Link
                to="/salas"
                className="nav-link text-dark d-flex align-items-center"
              >
                <i className="bi bi-door-open-fill me-2"></i>Gestión de Salas
              </Link>
            )}
            {hasPermission('VIEW_ASIGNATURAS') && (
              <Link
                to="/asignaturas"
                className="nav-link text-dark d-flex align-items-center"
              >
                <i className="bi bi-book-fill me-2"></i>Gestión de Asignaturas
              </Link>
            )}
            {hasPermission('VIEW_MODULOS') && (
              <Link
                to="/modulos"
                className="nav-link text-dark d-flex align-items-center"
              >
                <i className="bi bi-grid-1x2-fill me-2"></i>Gestión de Módulos
              </Link>
            )}
            {hasPermission('VIEW_USUARIOS') && (
              <Link
                to="/usuarios"
                className="nav-link text-dark d-flex align-items-center"
              >
                <i className="bi bi-people-fill me-2"></i>Gestión de Usuarios
              </Link>
            )}
            {hasPermission('VIEW_CARGA_DATOS') && (
              <Link
                to="/carga-datos"
                className="nav-link text-dark d-flex align-items-center"
              >
                <i className="bi bi-upload me-2"></i>Carga de Datos Masiva
              </Link>
            )}
            {hasPermission('VIEW_ROLES') && (
              <Link
                to="/roles"
                className="nav-link text-dark d-flex align-items-center"
              >
                <i className="bi bi-shield-lock-fill me-2"></i>Gestión de Roles
                y Permisos
              </Link>
            )}
            {/* Permiso para la sección de reportes */}
            {/* (Asumimos que 'VIEW_REPORTES' es el nombre del permiso en tu DB si decidiste protegerlo) */}
            {hasPermission('VIEW_REPORTES') && (
              <Link
                to="/reportes"
                className="nav-link fw-bold text-dark d-flex align-items-center"
              >
                <i className="bi bi-file-bar-graph-fill me-2"></i>Reportes
              </Link>
            )}
          </nav>

          {/* Botón de Cerrar Sesión */}
          <div className="mt-auto">
            <button
              className="btn btn-danger w-100 d-flex align-items-center justify-content-center"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
