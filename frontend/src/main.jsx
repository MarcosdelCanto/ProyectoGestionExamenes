import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App.jsx';
// --- NUEVAS IMPORTACIONES DE REACT ROUTER ---
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Asegúrate que esta ruta sea correcta
import './index.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// --- CREACIÓN DEL ROUTER ---
const router = createBrowserRouter([
  {
    path: '/*', // Esta ruta "catch-all" delega todo el manejo de sub-rutas a tu componente App
    Component: App, // Tu componente App ahora contiene <Routes> y <ScrollRestoration>
  },
  // Podrías definir otras rutas de nivel superior aquí si fuera necesario,
  // pero para la mayoría de los casos, la configuración de arriba es suficiente.
]);

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <Provider store={store}>
      {/* Si usas Redux */}
      <RouterProvider router={router} />
      {/* Usamos RouterProvider con el router creado */}
    </Provider>
  </StrictMode>
);
