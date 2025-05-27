import React from 'react';
import AgendaSemanal from '../components/calendario/AgendaSemanal';
import './CalendarioPage.css';
import Layout from '../components/Layout';

export default function CalendarioPage() {
  return (
    <Layout>
      <div className="page-calendario">
        <h1 className="page-title">Calendario Semanal</h1>
        <AgendaSemanal />
      </div>
    </Layout>
  );
}
