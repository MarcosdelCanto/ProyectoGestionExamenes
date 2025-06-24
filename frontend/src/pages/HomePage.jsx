import React, { useState, useEffect } from 'react';
import { changeStatus } from '../store/statusSlice';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import { logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import './HomePage.css'; // ¡Ahora este archivo es fundamental!
import { socket } from '../store/socketMiddleware';
import Layout from '../components/Layout';
import { FaUserCircle } from 'react-icons/fa';
import { SummaryDashboard } from '../components/SummaryDashboard/';
import DashboardConGraficos from '../components/dashboard/DashboardConGraficos'; // Importar el componente de gráficos
import { usePermission } from '../hooks/usePermission'; // <-- 1. Importar el hook de permisos
import Avatar from '../components/Avatar';
import { Button } from 'react-bootstrap';

export default function HomePage() {
  const { status, updaterId } = useSelector((state) => state.status);
  const dispatch = useDispatch();
  const [perfil, setPerfil] = useState(null);
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = usePermission(); // <-- 2. Usar el hook

  useEffect(() => {
    api('/usuarios/profile')
      .then((res) => {
        setPerfil(res.data.perfil);
      })
      .catch((err) => {
        console.error('Error obteniendo perfil:', err);
        logout();
        navigate('/login');
      });
  }, [navigate]);

  const puedeModificar = status === 'disponible' || socket.id === updaterId;

  const handleClick = () => {
    const next = status === 'disponible' ? 'pendiente' : ' CONFIRMADO';
    dispatch(changeStatus(next));
  };

  const handleLogout = () => {
    socket.disconnect();
    logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    // Check if the date is valid by checking if getTime() returns a number
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!perfil || permissionsLoading) {
    // <-- Mostrar carga mientras los permisos se verifican
    return (
      <Layout>
        <div className="loading-container">
          <p>Cargando perfil…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full">
        <div className="profile-card-compact">
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
        <hr></hr> {/* Asegura que este contenedor pueda usar el ancho */}
        {hasPermission('VIEW_DASHBOARD') ? (
          <div className="text-center my-4">
            <SummaryDashboard />
            <DashboardConGraficos />{' '}
            {/* Añadir el componente de gráficos aquí */}
          </div>
        ) : (
          <div className="text-center my-4 p-4 bg-light rounded">
            <p className="lead">
              Bienvenido al sistema de gestión de exámenes.
            </p>
          </div>
        )}
      </div>
      {/* Sección de estado y botón */}
      <div className="status-section">
        <div className={`status-circle status-${status}`} />
        <button onClick={handleClick} disabled={!puedeModificar}>
          {status === 'disponible'
            ? 'Ocupar'
            : status === 'pendiente'
              ? 'Confirmar'
              : 'Ocupado'}
        </button>
      </div>
    </Layout>
  );
}
