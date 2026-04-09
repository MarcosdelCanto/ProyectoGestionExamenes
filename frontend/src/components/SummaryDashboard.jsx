import React, { useState, useEffect } from 'react';
import { getDashboardSummary } from '../services/dashboardService'; // Importar el servicio
import './dashboardSummary.css'; // Archivo CSS para estilos específicos del dashboard

// Iconos de ejemplo, puedes usar los que prefieras de react-icons o bootstrap-icons
import {
  FaUniversity,
  FaBookOpen,
  FaUsers,
  FaClipboardList,
  FaChalkboardTeacher,
} from 'react-icons/fa';

const StatCard = ({ title, value, icon, color }) => (
  <div className="col mb-4" style={{ minWidth: '180px', maxWidth: '220px' }}>
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__icon-wrap">
        {React.cloneElement(icon, { size: 26 })}
      </div>
      <div className="stat-card__content">
        <span className="stat-card__label">{title}</span>
        <span className="stat-card__value">{value}</span>
      </div>
    </div>
  </div>
);

export const SummaryDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Suponemos un endpoint que devuelve todas las estadísticas necesarias
        const response = await getDashboardSummary(); // Usar el servicio
        setStats(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(
          'No se pudieron cargar los datos del dashboard. ' +
            (err.response?.data?.message || err.message)
        );
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <p>Cargando estadísticas del dashboard...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!stats) {
    return <p>No hay datos disponibles para mostrar en el dashboard.</p>;
  }

  // Ejemplo de datos que podría devolver la API:
  // stats = {
  //   totalSedes: 5,
  //   totalEscuelas: 12,
  //   totalCarreras: 30,
  //   totalAsignaturas: 250,
  //   totalUsuarios: 1200,
  //   totalDocentes: 150,
  //   examenesActivos: 25
  // }

  return (
    <div className="container-fluid dashboard-container">
      <h2 className="mb-4">Panel de Control General</h2>
      <div className="d-flex flex-wrap gap-3">
        <StatCard
          title="Sedes"
          value={stats.totalSedes || 0}
          icon={<FaUniversity />}
          color="primary"
        />
        <StatCard
          title="Escuelas"
          value={stats.totalEscuelas || 0}
          icon={<FaUniversity />}
          color="info"
        />
        <StatCard
          title="Carreras"
          value={stats.totalCarreras || 0}
          icon={<FaBookOpen />}
          color="success"
        />

        <StatCard
          title="Asignaturas"
          value={stats.totalAsignaturas || 0}
          icon={<FaBookOpen />}
          color="warning"
        />
        <StatCard
          title="Total Usuarios"
          value={stats.totalUsuarios || 0}
          icon={<FaUsers />}
          color="danger"
        />
        <StatCard
          title="Docentes"
          value={stats.totalDocentes || 0}
          icon={<FaChalkboardTeacher />}
          color="secondary"
        />

        <StatCard
          title="Exámenes Activos"
          value={stats.examenesActivos || 0}
          icon={<FaClipboardList />}
          color="dark"
        />
        {/* Puedes añadir más tarjetas aquí, por ejemplo, para exámenes, salas, etc. */}
      </div>

      {/* Aquí podrías añadir gráficos u otros componentes visuales */}
      {/*
      <div className="row mt-4">
        <div className="col-lg-6 mb-4">
          // Componente de gráfico para distribución de usuarios por rol
        </div>
        <div className="col-lg-6 mb-4">
          // Componente de gráfico para exámenes por estado
        </div>
      </div>
      */}
    </div>
  );
};
