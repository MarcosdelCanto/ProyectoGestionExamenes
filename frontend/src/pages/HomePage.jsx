import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';

// Componentes y Hooks
import Layout from '../components/Layout';
import Avatar from '../components/Avatar';
import { SummaryDashboard } from '../components/SummaryDashboard/';
import DashboardConGraficos from '../components/dashboard/DashboardConGraficos';
import CalendarioReservas from '../components/calendario/CalendarioReservas';
/* import { usePermission } from '../hooks/usePermission'; */ // <-- Hook causing error, disabled for now.

// Estilos
import './HomePage.css';

export default function HomePage() {
  const [perfil, setPerfil] = useState(null);
  const navigate = useNavigate();

  // Usar el hook de permisos para determinar qué mostrar
  // The line below was causing the error.
  // const { hasRole, isLoading: permissionsLoading } = usePermission();

  useEffect(() => {
    api
      .get('/usuarios/profile') // Usar api.get para consistencia
      .then((res) => {
        setPerfil(res.data.perfil);
      })
      .catch((err) => {
        console.error('Error obteniendo perfil:', err);
        logout();
        navigate('/login');
      });
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Mientras el perfil o los permisos están cargando, muestra un loader
  if (!perfil) {
    return (
      <Layout>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: '80vh' }}
        >
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando perfil...</span>
          </Spinner>
        </div>
      </Layout>
    );
  }

  // Helper function to check user role.
  // This replaces the functionality from the usePermission hook which was causing an error.
  const hasRole = (rolesToCheck) => {
    if (!perfil?.NOMBRE_ROL) return false;
    const userRole = perfil.NOMBRE_ROL;
    return Array.isArray(rolesToCheck)
      ? rolesToCheck.includes(userRole)
      : userRole === rolesToCheck;
  };

  // Una vez cargados, determina los roles para la lógica condicional
  const esDocenteOAlumno = hasRole(['DOCENTE', 'ALUMNO']);
  const puedeVerDashboard = hasRole([
    'ADMINISTRADOR',
    'JEFE CARRERA',
    'COORDINADOR CARRERA',
    'COORDINADOR DOCENTE',
  ]);

  return (
    <Layout>
      <div className="w-full">
        {/* Tarjeta de Perfil del Usuario (sin cambios) */}
        <div className="profile-card-compact m-2">
          <div className="profile-main-info">
            <Avatar name={perfil.NOMBRE_USUARIO} size={60} />
            <div className="profile-identity">
              <h2 className="profile-name-compact">{perfil.NOMBRE_USUARIO}</h2>
              <span className="badge bg-primary">{perfil.NOMBRE_ROL}</span>
            </div>
          </div>
          <div className="profile-secondary-info">
            <div className="profile-detail-item-compact">
              <i className="bi bi-envelope me-2"></i>
              <span>{perfil.EMAIL_USUARIO}</span>
            </div>
            <div className="profile-detail-item-compact">
              <i className="bi bi-calendar-check me-2"></i>
              <span>Miembro desde: {formatDate(perfil.FECHA_CREACION)}</span>
            </div>
          </div>
        </div>
        <hr />

        {/* --- INICIO DE LA LÓGICA CONDICIONAL DE CONTENIDO --- */}

        {/* 2. Si el usuario es Docente o Alumno, muestra el Calendario de Reservas */}
        {esDocenteOAlumno && <CalendarioReservas />}

        {/* 3. Si el usuario tiene un rol de gestión, muestra los Dashboards */}
        {puedeVerDashboard && (
          <div className="text-center my-4">
            <SummaryDashboard />
            <DashboardConGraficos />
          </div>
        )}

        {/* 4. Mensaje de bienvenida genérico si no cumple ninguna de las condiciones anteriores */}
        {!esDocenteOAlumno && !puedeVerDashboard && (
          <div className="text-center my-4 p-5 bg-light rounded">
            <h4 className="display-6">
              Bienvenido al Sistema de Gestión de Exámenes
            </h4>
            <p className="lead">Utiliza el menú de navegación para comenzar.</p>
          </div>
        )}

        {/* --- FIN DE LA LÓGICA CONDICIONAL --- */}
      </div>
    </Layout>
  );
}
