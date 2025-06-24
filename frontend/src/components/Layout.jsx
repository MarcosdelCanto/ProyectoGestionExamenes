// src/components/Layout.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout as authLogout } from '../services/authService';
import { usePermission } from '../hooks/usePermission';
import { Offcanvas } from 'bootstrap';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

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
  const [hoveredItem, setHoveredItem] = useState(null);

  // Estilos inline para el hover
  const navLinkStyle = {
    transition: 'background-color 0.2s ease-in-out',
    borderRadius: '5px',
    margin: '2px 0',
  };

  const getNavLinkHoverStyle = (isHovered) => {
    return isHovered ? { backgroundColor: '#e9ecef' } : {};
  };

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  const handleOverlayClick = () => {
    setIsSidebarMinimized(true);
  };

  // Componente de NavItem con hover y tooltip
  const NavItem = ({ to, icon, text, isBold = false, id }) => {
    const isHovered = hoveredItem === id;

    return isSidebarMinimized ? (
      <OverlayTrigger
        placement="right"
        overlay={<Tooltip id={`tooltip-${id}`}>{text}</Tooltip>}
      >
        <Link
          to={to}
          className={`nav-link ${isBold ? 'fw-bold' : ''} text-dark d-flex align-items-center`}
          style={{ ...navLinkStyle, ...getNavLinkHoverStyle(isHovered) }}
          onMouseEnter={() => setHoveredItem(id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className="sidebar-icon-container">
            <i className={`bi ${icon}`}></i>
          </div>
          <span className="sidebar-link-text">{text}</span>
        </Link>
      </OverlayTrigger>
    ) : (
      <Link
        to={to}
        className={`nav-link ${isBold ? 'fw-bold' : ''} text-dark d-flex align-items-center`}
        style={{ ...navLinkStyle, ...getNavLinkHoverStyle(isHovered) }}
        onMouseEnter={() => setHoveredItem(id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <div className="sidebar-icon-container">
          <i className={`bi ${icon}`}></i>
        </div>
        <span className="sidebar-link-text">{text}</span>
      </Link>
    );
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
    <div
      className="d-flex flex-column w-100"
      style={{ height: '100vh' }} // 1. Altura estricta y ocultar desbordamiento
    >
      <div
        className={`sidebar-overlay ${!isSidebarMinimized ? 'show' : ''}`}
        onClick={handleOverlayClick}
      ></div>

      <main
        className="d-flex flex-column flex-grow-1 bg-light app-main content-shifted-for-minimized-sidebar" // 2. Asegurar que es flex column
        style={{
          overflow: 'hidden', // 3. Evitar que <main> muestre su propio scroll
          position: 'relative', // Para contexto de posicionamiento si es necesario
          minHeight: 0, // 4. Crucial para que flex-grow-1 funcione bien con contenido interno
        }}
      >
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
            <NavItem
              to="/"
              icon="bi-house-door-fill"
              text="Inicio"
              isBold={true}
              id="inicio"
            />

            {hasPermission('VIEW_CALENDARIO') && (
              <NavItem
                to="/calendario"
                icon="bi-calendar3"
                text="Calendario"
                id="calendario"
              />
            )}

            <NavItem
              to="/mis-reservas"
              icon="bi-calendar-check-fill"
              text="Exámenes Programados"
              id="examenes-programados"
            />

            {hasPermission('VIEW_EXAMENES') && (
              <NavItem
                to="/examen"
                icon="bi-file-earmark-text-fill"
                text="Gestión de Exámenes"
                id="examenes"
              />
            )}

            {hasPermission('VIEW_ASIGNATURAS') && (
              <NavItem
                to="/asignaturas"
                icon="bi-book-fill"
                text="Gestión de Asignaturas"
                id="asignaturas"
              />
            )}

            {hasPermission('VIEW_SALAS') && (
              <NavItem
                to="/salas"
                icon="bi-door-open-fill"
                text="Gestión de Salas"
                id="salas"
              />
            )}

            {hasPermission('VIEW_MODULOS') && (
              <NavItem
                to="/modulos"
                icon="bi-grid-1x2-fill"
                text="Gestión de Módulos"
                id="modulos"
              />
            )}

            {hasPermission('VIEW_USUARIOS') && (
              <NavItem
                to="/usuarios"
                icon="bi-people-fill"
                text="Gestión de Usuarios"
                id="usuarios"
              />
            )}

            {hasPermission('VIEW_ROLES') && (
              <NavItem
                to="/roles"
                icon="bi-shield-lock-fill"
                text="Gestión de Permisos"
                id="roles"
              />
            )}

            {hasPermission('VIEW_CARGA_DATOS') && (
              <NavItem
                to="/carga-datos"
                icon="bi-cloud-upload-fill"
                text="Carga de Datos Masiva"
                id="carga-datos"
              />
            )}

            {hasPermission('VIEW_REPORTES') && (
              <NavItem
                to="/reportes"
                icon="bi-file-bar-graph-fill"
                text="Reportes"
                id="reportes"
              />
            )}
          </nav>

          <div className="mt-auto">
            {isSidebarMinimized ? (
              <OverlayTrigger
                placement="right"
                overlay={<Tooltip id="tooltip-logout">Cerrar sesión</Tooltip>}
              >
                <button
                  className="btn btn-danger w-100 d-flex align-items-center justify-content-center"
                  onClick={handleLogout}
                  style={{
                    ...navLinkStyle,
                    ...getNavLinkHoverStyle(hoveredItem === 'logout'),
                  }}
                  onMouseEnter={() => setHoveredItem('logout')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="sidebar-icon-container">
                    <i className="bi bi-box-arrow-right"></i>
                  </div>
                  <span className="sidebar-link-text">Cerrar sesión</span>
                </button>
              </OverlayTrigger>
            ) : (
              <button
                className="btn btn-danger w-100 d-flex align-items-center justify-content-center"
                onClick={handleLogout}
                style={{
                  ...navLinkStyle,
                  ...getNavLinkHoverStyle(hoveredItem === 'logout'),
                }}
                onMouseEnter={() => setHoveredItem('logout')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="sidebar-icon-container">
                  <i className="bi bi-box-arrow-right me-2"></i>
                </div>
                <span className="sidebar-link-text">Cerrar sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
