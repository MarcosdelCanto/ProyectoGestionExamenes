import React from 'react';
import CSVUpload from '../components/cargaDatos/CSVUpload';
import Layout from '../components/Layout';

const CargaDatosPage = () => {
  return (
    <Layout>
      <div>
        <h2>Carga masiva de datos</h2>
        <CSVUpload />
      </div>
    </Layout>
  );
};

export default CargaDatosPage;
