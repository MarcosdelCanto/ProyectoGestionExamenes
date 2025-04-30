// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import ModulosPage from './pages/ModulosPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de login */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/modulos" element={<ModulosPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
