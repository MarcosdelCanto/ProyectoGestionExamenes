// src/pages/UnauthorizedPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function UnauthorizedPage() {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <h1 className="display-1 text-danger">403</h1>
          <h2>Acceso Denegado</h2>
          <p className="lead">
            Lo sentimos, no tienes los permisos necesarios para acceder a esta
            página.
          </p>
          <Link to="/" className="btn btn-primary mt-3">
            Volver a la Página Principal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
