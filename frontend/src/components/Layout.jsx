import { Link } from 'react-router-dom';

export default function Layout({ children }) {
  return (
    <div className="d-flex flex-column w-100" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header
        className="d-flex justify-content-between align-items-center px-4 py-2 border-bottom bg-white shadow-sm"
        style={{ height: '80px' }}
      >
        {/* Botón hamburguesa visible solo en móvil */}
        <button
          className="btn btn-outline-primary d-md-none"
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
      {/* Body*/}
      <div className="d-flex flex-grow-1">
        {/* Sidebar: Visible en desktop */}
        <div
          className="d-none d-md-flex flex-column bg-light p-3 border-end"
          style={{ width: '250px' }}
        >
          <nav className="nav flex-column mb-auto">
            <Link to="/" className="nav-link fw-bold text-dark">
              Inicio{' '}
            </Link>
            <Link to="/calendario" className="nav-link text-dark">
              Calendario
            </Link>
            <Link to="/examenes" className="nav-link text-dark">
              Exámenes
            </Link>
            <Link to="/salas" className="nav-link text-dark">
              Salas
            </Link>
            <Link to="/modulos" className="nav-link text-dark">
              Modulos
            </Link>
            <Link to="/usuarios" className="nav-link text-dark">
              Usuarios
            </Link>
            <Link to="/carga-datos" className="nav-link text-primary text-dark">
              Carga de datos
            </Link>
          </nav>
          {/* Botón cerrar sesión desktop */}
          <div className="mt-auto">
            <button className="btn btn-danger w-100">Cerrar sesión</button>
          </div>
        </div>
        {/* Main Content */}
        <main className="flex-grow-1 p-4 bg-light overflow-auto">
          {children}
        </main>

        {/* Sidebar: Offcanvas en móvil*/}
        <div
          className="offcanvas offcanvas-start d-md-none bg-light"
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
              <Link to="/" className="nav-link fw-bold text-dark">
                Inicio{' '}
              </Link>
              <Link to="/calendario" className="nav-link text-dark">
                Calendario
              </Link>
              <Link to="/examenes" className="nav-link text-dark">
                Exámenes
              </Link>
              <Link to="/salas" className="nav-link text-dark">
                Salas
              </Link>
              <Link to="/modulos" className="nav-link text-dark">
                Modulos
              </Link>
              <Link to="/usuarios" className="nav-link text-dark">
                Usuarios
              </Link>
              <Link
                to="/carga-datos"
                className="nav-link text-primary text-dark"
              >
                Carga de datos
              </Link>
            </nav>
            <div className="mt-auto">
              <button className="btn btn-danger w-100">Cerrar sesión</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
