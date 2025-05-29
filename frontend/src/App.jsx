// src/App.jsx
import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import ModulosPage from './pages/ModulosPage';
import UsuariosPage from './pages/UsuariosPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import PrivateRoute from './components/PrivateRoute';
import SalasPage from './pages/SalasPage';
import AsignaturasPage from './pages/AsignaturasPage';
import ExamenesPage from './pages/ExamenesPage';
import CalendarioPage from './pages/CalendarioPage';
import CargaDatosPage from './pages/CargaDatosPage';
import RolesPage from './pages/RolesPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import { ROLES } from './constants/roles';

function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <DndProvider backend={HTML5Backend}>
        <Routes>
          {/* Ruta pública de login */}
          <Route path="/login" element={<Login />} />

          {/* Página de acceso no autorizado */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Rutas que solo requieren autenticación */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<HomePage />} />
          </Route>

          {/* Rutas protegidas por permisos específicos */}
          <Route
            element={<PrivateRoute requiredPermissions={['VIEW_CALENDARIO']} />}
          >
            <Route path="/calendario" element={<CalendarioPage />} />
          </Route>

          <Route
            element={<PrivateRoute requiredPermissions={['VIEW_EXAMENES']} />}
          >
            <Route path="/examenes" element={<ExamenesPage />} />
          </Route>

          <Route
            element={<PrivateRoute requiredPermissions={['VIEW_SALAS']} />}
          >
            <Route path="/salas" element={<SalasPage />} />
          </Route>

          <Route
            element={
              <PrivateRoute requiredPermissions={['VIEW_ASIGNATURAS']} />
            }
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
            element={
              <PrivateRoute requiredPermissions={['VIEW_CARGA_DATOS']} />
            }
          >
            <Route path="/carga-datos" element={<CargaDatosPage />} />
          </Route>

          <Route
            element={<PrivateRoute requiredPermissions={['VIEW_ROLES']} />}
          >
            <Route path="/roles" element={<RolesPage />} />
          </Route>
        </Routes>
      </DndProvider>
    </BrowserRouter>
  );
}

export default App;
