import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout'; // <-- 1. IMPORTAR Layout
import { Container } from 'react-bootstrap'; // <-- 2. IMPORTAR Container

function UnauthorizedPage() {
  return (
    <Layout>
      <Container
        fluid
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '80vh' }}
      >
        <div className="text-center">
          <h1 className="display-1 text-danger fw-bold">403</h1>
          <h2>Acceso Denegado</h2>
          <p className="lead text-muted">
            Lo sentimos, no tienes los permisos necesarios para acceder a esta
            página.
          </p>
          <Link to="/" className="btn btn-primary mt-3">
            Volver a la Página Principal
          </Link>
        </div>
      </Container>
    </Layout>
  );
}

export default UnauthorizedPage;
