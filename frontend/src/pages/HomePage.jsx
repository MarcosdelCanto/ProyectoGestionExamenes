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
import { Dashboard } from '../components/dashboard/';
import DashboardConGraficos from '../components/dashboard/DashboardConGraficos'; // Importar el componente de gráficos

export default function HomePage() {
  const { status, updaterId } = useSelector((state) => state.status);
  const dispatch = useDispatch();
  const [perfil, setPerfil] = useState(null);
  const navigate = useNavigate();

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

  if (!perfil) {
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
        <div className="profile-card ">
          {/* Sección del Ícono/Imagen (Izquierda) */}
          <div className="profile-card-icon-section">
            <FaUserCircle className="profile-icon" />
            <p className="profile-role">
              {perfil.NOMBRE_ROL || `Rol ID: ${perfil.ROL_ID_ROL}`}
            </p>
          </div>

          {/* Sección de la Información (Derecha) */}
          <div className="profile-card-info-section">
            <h1 className="profile-name">{perfil.NOMBRE_USUARIO}</h1>
            <p className="profile-email">{perfil.EMAIL_USUARIO}</p>

            <div className="profile-details">
              <div className="profile-detail-row">
                <strong className="profile-detail-label">Rol:</strong>
                <span className="profile-detail-value">
                  {perfil.NOMBRE_ROL || perfil.ROL_ID_ROL}
                </span>
              </div>
              <div className="profile-detail-row">
                <strong className="profile-detail-label">
                  Registrado desde:
                </strong>
                <span className="profile-detail-value">
                  {formatDate(perfil.FECHA_CREACION)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <hr></hr> {/* Asegura que este contenedor pueda usar el ancho */}
        <div className="text-center my-4">
          <Dashboard />
          <DashboardConGraficos /> {/* Añadir el componente de gráficos aquí */}
        </div>
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
