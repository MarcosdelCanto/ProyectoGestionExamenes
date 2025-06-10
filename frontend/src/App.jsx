// src/App.jsx
import React from 'react';
import {
  Routes,
  Route,
  ScrollRestoration, // Lo importamos aquí para usarlo
} from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Tus Páginas
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import ModulosPage from './pages/ModulosPage';
import UsuariosPage from './pages/UsuariosPage';
import SalasPage from './pages/SalasPage';
import AsignaturasPage from './pages/AsignaturasPage';
import ExamenesPage from './pages/ExamenesPage';
import CalendarioPage from './pages/CalendarioPage';
import CargaDatosPage from './pages/CargaDatosPage';
import RolesPage from './pages/RolesPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ReportesPage from './pages/ReportesPage';
import DocenteReservasPage from './pages/DocenteReservasPage';
import CrearReservaPage from './pages/CrearReservaPage';
import MisReservasAsignadasPage from './pages/MisReservasAsignadasPage.jsx';
import ConsultaExamenes from './pages/ConsultaExamenes.jsx';

// Componentes
import PrivateRoute from './components/PrivateRoute';

// Estilos (ya estaban bien)
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css'; // Si tus estilos globales principales están referenciados desde main.jsx, está bien.

function App() {
  return (
    // <BrowserRouter> SE ELIMINA DE AQUÍ
    <DndProvider backend={HTML5Backend}>
      <Routes>
        {/* Ruta pública de login */}
        <Route path="/login" element={<Login />} />
        <Route path="/consulta-examenes" element={<ConsultaExamenes />} />

        {/* Página de acceso no autorizado */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Ruta pública de inicio */}
        <Route path="/" element={<HomePage />} />

        {/* Ruta para que el alumno vea sus reservas  CONFIRMADOs */}
        {/* Rutas protegidas por permisos específicos */}
        <Route
          element={<PrivateRoute requiredPermissions={['VIEW_CALENDARIO']} />}
        >
          <Route path="/calendario" element={<CalendarioPage />} />
        </Route>

        {/* Ruta para que el docente vea sus reservas pendientes */}
        {/* Usando el nombre de permiso que definimos en la BD */}
        <Route
          element={
            <PrivateRoute
              requiredPermissions={['DOCENTE_VIEW_RESERVAS_PENDIENTES']}
            />
          }
        >
          <Route
            path="/reserva/docente/pendientes"
            element={<DocenteReservasPage />}
          />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/mis-reservas" element={<MisReservasAsignadasPage />} />
        </Route>

        {/* Ruta para crear reservas */}
        {/* Usando el nombre de permiso que definimos en la BD */}
        <Route
          element={
            <PrivateRoute requiredPermissions={['CREATE_RESERVAS_EXAMEN']} />
          }
        >
          <Route path="/reservas/crear" element={<CrearReservaPage />} />
        </Route>

        <Route
          element={<PrivateRoute requiredPermissions={['VIEW_EXAMENES']} />}
        >
          <Route path="/examen" element={<ExamenesPage />} />
        </Route>

        <Route element={<PrivateRoute requiredPermissions={['VIEW_SALAS']} />}>
          <Route path="/salas" element={<SalasPage />} />
        </Route>

        <Route
          element={<PrivateRoute requiredPermissions={['VIEW_ASIGNATURAS']} />}
        >
          <Route path="/asignaturas" element={<AsignaturasPage />} />
        </Route>

        <Route
          element={<PrivateRoute requiredPermissions={['VIEW_MODULOS']} />}
        >
          <Route path="/modulos" element={<ModulosPage />} />
        </Route>

        <Route
          element={<PrivateRoute requiredPermissions={['VIEW_USUARIOS']} />}
        >
          <Route path="/usuarios" element={<UsuariosPage />} />
        </Route>

        <Route
          element={<PrivateRoute requiredPermissions={['VIEW_CARGA_DATOS']} />}
        >
          <Route path="/carga-datos" element={<CargaDatosPage />} />
        </Route>

        <Route element={<PrivateRoute requiredPermissions={['VIEW_ROLES']} />}>
          <Route path="/roles" element={<RolesPage />} />
        </Route>

        <Route
          element={<PrivateRoute requiredPermissions={['VIEW_REPORTES']} />}
        >
          <Route path="/reportes" element={<ReportesPage />} />
        </Route>

        {/* Si tienes otras rutas, asegúrate de que estén aquí */}
      </Routes>
      <ScrollRestoration />
      {/* ScrollRestoration ahora funcionará correctamente */}
    </DndProvider>
    // </BrowserRouter> SE ELIMINA DE AQUÍ
  );
}

export default App;
