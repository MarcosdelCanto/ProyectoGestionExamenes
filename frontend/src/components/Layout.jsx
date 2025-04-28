import { Link } from 'react-router-dom';

export default function Layout({ children }) {
  return (
    <div className="d-flex flex-column w-100" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header
        className="d-flex justify-content-between align-items-center px-4 py-2 border-bottom bg-white shadow-sm"
        style={{ height: '80px' }}
      >
        <img
          src="/images/logoduoc.svg.png"
          alt="Logo Institucional"
          className="me-3"
          style={{ height: '50px' }}
        />
      </header>

      {/* Body: Sidebar + Main */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <aside
          className="bg-light p-3 d-flex flex-column"
          style={{ width: '250px' }}
        >
          <nav className="nav flex-column mb-auto">
            <Link to="/" className="nav-link fw-bold">
              Inicio
            </Link>
            <Link to="/calendario" className="nav-link">
              Calendario
            </Link>
            <Link to="/examenes" className="nav-link fw-bold">
              Exámenes
            </Link>
            <Link to="/salas" className="nav-link">
              Salas
            </Link>
            <Link to="/usuarios" className="nav-link">
              Usuarios
            </Link>
            <Link to="/carga-datos" className="nav-link text-primary fw-bold">
              Carga de datos
            </Link>
          </nav>
          <div className="mt-auto">
            <button className="btn btn-danger w-100">Cerrar sesión</button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow-1 p-4 bg-light overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
