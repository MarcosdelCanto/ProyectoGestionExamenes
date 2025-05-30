import React from 'react';
import Modal from 'react-modal';
import ExamenesPorCarreraChart from './charts/ExamenesPorCarreraChart';
import ModulosAgendadosChart from './charts/ModulosAgendadosChart';
import UsoSalasChart from './charts/UsoSalasChart';
import ExamenesPorDiaChart from './charts/ExamenesPorDiaChart';
import './DashboardConGraficos.css'; // Crearemos este archivo para estilos adicionales

// Configuración de React Modal
Modal.setAppElement('#root'); // Asegúrate que '#root' es el ID de tu elemento raíz de la aplicación

const DashboardConGraficos = () => {
  // --- Renderizado ---
  // Comprobación global de carga o error (opcional, si prefieres manejar por gráfico)
  // if (examenesCarrera.isLoading || modulosAgendados.isLoading || usoSalas.isLoading || examenesPorDia.isLoading) {
  //   return <div className="container-fluid p-4"><p>Cargando gráficos del dashboard...</p></div>;
  // }
  // if (examenesCarrera.error || modulosAgendados.error || usoSalas.error || examenesPorDia.error) {
  //   return <div className="container-fluid p-4"><div className="alert alert-danger">Error al cargar algunos gráficos.</div></div>;
  // }
  return (
    <div className="row g-3 g-md-4 p-3 p-md-4">
      {/* Gráfico de Exámenes por Carrera */}
      <div className="col-12 col-md-6 mb-4">
        <ExamenesPorCarreraChart />
      </div>

      {/* Gráfico de Módulos más agendados */}
      <div className="col-12 col-md-6 mb-4">
        <ModulosAgendadosChart />
      </div>

      {/* Gráfico de Distribución de Salas */}
      <div className="col-12 col-md-6 mb-4">
        <UsoSalasChart />
      </div>

      {/* Exámenes por Día */}
      <div className="col-12 col-md-6 mb-4">
        <ExamenesPorDiaChart />
      </div>
      {/* Modals will be part of their respective components */}
    </div>
  );
};

export default DashboardConGraficos;
