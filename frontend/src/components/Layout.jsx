import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout as authLogout } from '../services/authService'; // Importamos logout y getCurrentUser
import { ROLES } from '../constants/roles'; // Importar desde el archivo de constantes

export default function Layout({ children }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    authLogout(); // Usamos la función logout del servicio de autenticación
    navigate('/login');
  };

  const canAccess = (allowedRoles) => {
    if (!currentUser || !currentUser.isAuthenticated || !currentUser.rol) {
      return false;
    }
    return allowedRoles.includes(currentUser.rol);
  };

  return (
    <div className="d-flex flex-column w-100" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header
        className="d-flex justify-content-between align-items-center px-4 py-2 border-bottom bg-white shadow-sm"
        style={{ height: '80px' }}
      >
        {/* Botón hamburguesa siempre visible */}
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
            {/* Rutas accesibles para CUALQUIER ROL AUTENTICADO */}
            {canAccess([
              ROLES.ADMIN,
              ROLES.DIRECTOR,
              ROLES.PROFESOR,
              ROLES.ESTUDIANTE,
            ]) && (
              <>
                <Link to="/" className="nav-link fw-bold text-dark">
                  Inicio
                </Link>
                <Link to="/calendario" className="nav-link text-dark">
                  Calendario
                </Link>
              </>
            )}

            {/* Rutas para Directores (Gestores) y Administradores */}
            {canAccess([ROLES.ADMIN, ROLES.DIRECTOR]) && (
              <>
                <Link to="/examenes" className="nav-link text-dark">
                  Exámenes
                </Link>
                <Link to="/salas" className="nav-link text-dark">
                  Salas
                </Link>
                <Link to="/asignaturas" className="nav-link text-dark">
                  Asignaturas
                </Link>
                <Link to="/modulos" className="nav-link text-dark">
                  Módulos
                </Link>
              </>
            )}

            {/* Rutas solo para Administradores */}
            {canAccess([ROLES.ADMIN]) && (
              <>
                <Link to="/usuarios" className="nav-link text-dark">
                  Usuarios
                </Link>
                <Link to="/carga-datos" className="nav-link text-dark">
                  Carga de datos
                </Link>
                <Link to="/roles" className="nav-link text-dark">
                  {' '}
                  {/* Enlace al mantenedor de roles */}
                  Gestión de Roles
                </Link>
              </>
            )}

            {/* Ejemplo: Si tuvieras un enlace solo para profesores */}
            {/* {canAccess([ROLES.PROFESOR]) && (
              <Link to="/mis-calificaciones" className="nav-link text-dark">
                Mis Calificaciones
              </Link>
            )} */}
            {/* Ejemplo: Si tuvieras un enlace solo para estudiantes */}
            {/* {canAccess([ROLES.ESTUDIANTE]) && (
              <Link to="/mis-cursos" className="nav-link text-dark">
                Mis Cursos
              </Link>
            )} */}
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
