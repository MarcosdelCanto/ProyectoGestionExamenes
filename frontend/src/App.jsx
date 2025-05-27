// src/App.jsx
import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import ModulosPage from './pages/ModulosPage';
import UsuariosPage from './pages/UsuariosPage';
//import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import PrivateRoute from './components/PrivateRoute';
import SalasPage from './pages/SalasPage';
import AsignaturasPage from './pages/AsignaturasPage';
import ExamenesPage from './pages/ExamenesPage';
import CalendarioPage from './pages/CalendarioPage';
import CargaDatosPage from './pages/CargaDatosPage';
import UnauthorizedPage from './pages/UnauthorizedPage'; // Nueva página
import RolesPage from './pages/RolesPage'; // Importar la nueva página de Roles
import { ROLES } from './constants/roles'; // Importar desde el archivo de constantes
function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        {/* Ruta pública de login */}
        <Route path="/login" element={<Login />} />
        {/* Ruta para acceso no autorizado */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Rutas accesibles para CUALQUIER ROL AUTENTICADO */}
        {/* Si una ruta es común a todos, puede ir aquí. */}
        <Route
          element={
            <PrivateRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.DIRECTOR,
                ROLES.PROFESOR,
                ROLES.ESTUDIANTE,
              ]}
            />
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/calendario" element={<CalendarioPage />} />
        </Route>

        {/* Rutas para Gestores y Administradores */}
        {/* Estas rutas también serán accesibles para ADMIN porque ADMIN está incluido en allowedRoles */}

        <Route
          element={
            <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.DIRECTOR]} />
          }
        >
          <Route path="/modulos" element={<ModulosPage />} />
          <Route path="/salas" element={<SalasPage />} />
          <Route path="/asignaturas" element={<AsignaturasPage />} />
          <Route path="/examenes" element={<ExamenesPage />} />
        </Route>

        {/* Rutas solo para Administradores */}
        {/* Estas son rutas exclusivas para el rol ADMIN. */}
        <Route element={<PrivateRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/carga-datos" element={<CargaDatosPage />} />
          <Route path="/roles" element={<RolesPage />} />{' '}
          {/* Nueva ruta para el mantenedor de roles */}
        </Route>

        {/* Puedes tener una ruta genérica para cualquier usuario autenticado si es necesario */}
        {/* <Route element={<PrivateRoute />}> */}
        {/*   <Route path="/perfil" element={<ProfilePage />} /> */}
        {/* </Route> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
