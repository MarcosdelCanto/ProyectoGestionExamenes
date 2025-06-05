// src/components/Layout.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout as authLogout } from '../services/authService';
import { usePermission } from '../hooks/usePermission';
import { Offcanvas } from 'bootstrap';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { hasPermission, loading } = usePermission();
  const location = useLocation();
  const offcanvasRef = useRef(null);
  const offcanvasInstanceRef = useRef(null);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [isLogoVisibleForRender, setIsLogoVisibleForRender] =
    useState(!isSidebarMinimized);

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  const handleOverlayClick = () => {
    setIsSidebarMinimized(true);
  };

  useEffect(() => {
    if (offcanvasRef.current) {
      const bsOffcanvas = new Offcanvas(offcanvasRef.current, {
        backdrop: false, // Impide que se cierre al hacer clic fuera
        keyboard: false, // Impide que se cierre con la tecla ESC
      });
      offcanvasInstanceRef.current = bsOffcanvas;
      bsOffcanvas.show(); // Muestra el Offcanvas al montar el componente
    }
    return () => {
      if (
        offcanvasInstanceRef.current &&
        typeof offcanvasInstanceRef.current.dispose === 'function'
      ) {
        offcanvasInstanceRef.current.dispose();
      }
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (
        document.body.style.overflow === 'hidden' &&
        (!offcanvasInstanceRef.current ||
          !offcanvasInstanceRef.current._isShown)
      ) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  useEffect(() => {
    const sidebarElement = offcanvasRef.current;
    if (sidebarElement) {
      const handleHidden = () => {
        setIsSidebarMinimized(true);
      };
      sidebarElement.addEventListener('hidden.bs.offcanvas', handleHidden);
      return () => {
        sidebarElement.removeEventListener('hidden.bs.offcanvas', handleHidden);
      };
    }
  }, []);

  // Efecto para manejar la visibilidad del logo con retardo
  useEffect(() => {
    let timer;
    if (isSidebarMinimized) {
      timer = setTimeout(() => {
        setIsLogoVisibleForRender(false);
      }, 250);
    } else {
      setIsLogoVisibleForRender(true);
    }
    return () => clearTimeout(timer);
  }, [isSidebarMinimized]);

  //Efecto para controlar el scroll del body
  useEffect(() => {
    if (isSidebarMinimized) {
      // Bloquear scroll cuando está expandido
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar scroll cuando está minimizado
      document.body.style.overflow = '';
    }

    // Cleanup al desmontar
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarMinimized]);

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
      <div
        className={`sidebar-overlay ${!isSidebarMinimized ? 'show' : ''}`}
        onClick={handleOverlayClick}
      ></div>

      <main className="flex-grow-1 p-4 bg-light overflow-auto app-main content-shifted-for-minimized-sidebar">
        {children}
      </main>

      <div
        ref={offcanvasRef}
        className={`offcanvas offcanvas-start bg-light show ${isSidebarMinimized ? 'sidebar-minimized-custom' : 'sidebar-expanded-custom'}`}
        tabIndex="-1"
        id="offcanvasSidebar"
        aria-labelledby="offcanvasSidebarLabel"
      >
        <div className="offcanvas-header">
          {/* Contenedor del logo */}
          <div className="sidebar-logo-container">
            {/* Renderizar el logo basado en isLogoVisibleForRender */}
            {isLogoVisibleForRender && (
              <img
                src="/images/logoduoc.svg.png" // Asegúrate que la ruta sea correcta
                alt="Logo Institucional"
                className="sidebar-logo img-fluid" // Añade clases para control CSS
              />
            )}
          </div>
          <button
            type="button"
            className="btn" // Botón para minimizar/expandir
            aria-label={isSidebarMinimized ? 'Expandir menú' : 'Minimizar menú'}
            onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
          >
            {isSidebarMinimized ? (
              <i className="bi bi-arrow-right-square-fill fs-5"></i>
            ) : (
              <i className="bi bi-arrow-left-square-fill fs-5"></i>
            )}
          </button>
        </div>
        <div className="offcanvas-body p-3 d-flex flex-column">
          <nav className="nav flex-column mb-auto">
            <Link
              to="/"
              className="nav-link fw-bold text-dark d-flex align-items-center"
            >
              <div className="sidebar-icon-container">
                <i className="bi bi-house-door-fill"></i>
              </div>

              <span className="sidebar-link-text">Inicio</span>
            </Link>
            <Link
              to="/mis-reservas"
              className="nav-link text-dark d-flex align-items-center"
            >
              <div className="sidebar-icon-container">
                <i className="bi bi-calendar-check-fill"></i>
              </div>

              <span className="sidebar-link-text">Exámenes Programados</span>
            </Link>
            {hasPermission('VIEW_CALENDARIO') && (
              <Link
                to="/calendario"
                className="nav-link text-dark d-flex align-items-center"
              >
                <div className="sidebar-icon-container">
                  <i className="bi bi-calendar3"></i>
                </div>

                <span className="sidebar-link-text">Calendario</span>
              </Link>
            )}
            {hasPermission('VIEW_EXAMENES') && (
              <Link
                to="/examen"
                className="nav-link text-dark d-flex align-items-center"
              >
                <div className="sidebar-icon-container">
                  <i className="bi bi-file-earmark-text-fill"></i>
                </div>

                <span className="sidebar-link-text">Gestión de Exámenes</span>
              </Link>
            )}
            {hasPermission('CREATE_RESERVAS_EXAMEN') && (
              <Link
                to="/reservas/crear"
                className="nav-link text-dark d-flex align-items-center"
              >
                <div className="sidebar-icon-container">
                  <i className="bi bi-calendar-plus-fill"></i>
                </div>

                <span className="sidebar-link-text">Crear Reserva</span>
              </Link>
            )}
            {hasPermission('DOCENTE_VIEW_RESERVAS_PENDIENTES') && (
              <Link
                to="/reserva/docente/pendientes"
                className="nav-link text-dark d-flex align-items-center"
              >
                <div className="sidebar-icon-container">
                  <i className="bi bi-calendar-event-fill"></i>
                </div>
                <span className="sidebar-link-text">Reservas Pendientes</span>
              </Link>
            )}
            {hasPermission('VIEW_SALAS') && (
              <Link
                to="/salas"
                className="nav-link text-dark d-flex align-items-center"
              >
                <div className="sidebar-icon-container">
                  <i className="bi bi-door-open-fill"></i>
                </div>
                <span className="sidebar-link-text">Gestión de Salas</span>
              </Link>
            )}
            {hasPermission('VIEW_ASIGNATURAS') && (
              <Link
                to="/asignaturas"
                className="nav-link text-dark d-flex align-items-center"
              >
                <div className="sidebar-icon-container">
                  <i className="bi bi-book-fill"></i>
                </div>
                <span className="sidebar-link-text">
                  Gestión de Asignaturas
                </span>
              </Link>
            )}
            {hasPermission('VIEW_MODULOS') && (
              <Link
                to="/modulos"
                className="nav-link text-dark d-flex align-items-center"
              >
                <div className="sidebar-icon-container">
                  <i className="bi bi-grid-1x2-fill"></i>
                </div>

                <span className="sidebar-link-text">Gestión de Módulos</span>
              </Link>
            )}
            {hasPermission('VIEW_USUARIOS') && (
              <Link
                to="/usuarios"
                className="nav-link text-dark d-flex align-items-center"
              >
                <div className="sidebar-icon-container">
                  <i className="bi bi-people-fill"></i>
                </div>
                <span className="sidebar-link-text">Gestión de Usuarios</span>
              </Link>
            )}
            {hasPermission('VIEW_CARGA_DATOS') && (
              <Link
                to="/carga-datos"
                className="nav-link text-dark d-flex align-items-center"
              >
                <div className="sidebar-icon-container">
                  <i className="bi bi-upload"></i>
                </div>

                <span className="sidebar-link-text">Carga de Datos Masiva</span>
              </Link>
            )}
            {hasPermission('VIEW_ROLES') && (
              <Link
                to="/roles"
                className="nav-link text-dark d-flex align-items-center"
              >
                <div className="sidebar-icon-container">
                  <i className="bi bi-shield-lock-fill"></i>
                </div>

                <span className="sidebar-link-text">Gestión de Permisos</span>
              </Link>
            )}
            {hasPermission('VIEW_REPORTES') && (
              <Link
                to="/reportes"
                className="nav-link text-dark d-flex align-items-center"
              >
                <div className="sidebar-icon-container">
                  <i className="bi bi-file-bar-graph-fill"></i>
                </div>

                <span className="sidebar-link-text">Reportes</span>
              </Link>
            )}
          </nav>

          <div className="mt-auto">
            <button
              className="btn btn-danger w-100 d-flex align-items-center justify-content-center"
              onClick={handleLogout}
            >
              <div className="sidebar-icon-container">
                <i className="bi bi-box-arrow-right me-2"></i>
              </div>

              <span className="sidebar-link-text"> Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
