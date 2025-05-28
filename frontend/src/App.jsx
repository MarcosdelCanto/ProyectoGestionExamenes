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

function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <DndProvider backend={HTML5Backend}>
        <Routes>
          {/* Ruta pública de login */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/modulos" element={<ModulosPage />} />
            <Route path="/salas" element={<SalasPage />} />
            <Route path="/asignaturas" element={<AsignaturasPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/examenes" element={<ExamenesPage />} />
            <Route path="/calendario" element={<CalendarioPage />} />
            <Route path="/carga-datos" element={<CargaDatosPage />} />
            <Route path="/roles" element={<RolesPage />} />
          </Route>
        </Routes>
      </DndProvider>
    </BrowserRouter>
  );
}

export default App;
