// src/App.jsx
import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import ModulosPage from './pages/ModulosPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import PrivateRoute from './components/PrivateRoute';
import SalasPage from './pages/SalasPage';
import AsignaturasPage from './pages/AsignaturasPage';

function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        {/* Ruta pública de login */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/modulos" element={<ModulosPage />} />
          <Route path="/salas" element={<SalasPage />} />
          <Route path="/asignaturas" element={<AsignaturasPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
