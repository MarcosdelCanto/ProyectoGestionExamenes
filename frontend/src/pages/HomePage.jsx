import React, { useState, useEffect } from 'react';
import { changeStatus } from '../store/statusSlice';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWithAuth } from '../services/api';
import { logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { socket } from '../store/socketMiddleware';

export default function HomePage() {
  const { status, updaterId } = useSelector((state) => state.status);
  const dispatch = useDispatch();
  const [perfil, setPerfil] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWithAuth('/api/user/profile')
      .then((res) => res.json())
      .then((data) => setPerfil(data.perfil))
      .catch((err) => {
        console.error('Error obteniendo perfil:', err);
        logout();
        navigate('/login');
      });
  }, [navigate]);

  const puedeModificar = status === 'disponible' || socket.id === updaterId;

  // Handlers que despachan el cambio de estado
  const handleClick = () => {
    const next = status === 'disponible' ? 'pendiente' : 'confirmada';
    dispatch(changeStatus(next));
  };

  const handleLogout = () => {
    socket.disconnect();
    logout();
    navigate('/login');
  };

  if (!perfil) return <p>Cargando perfil…</p>;

  return (
    <div className="homepage-wrapper">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Bienvenido, {perfil.NOMBRE_USUARIO}</h1>
        <button onClick={handleLogout} className="btn btn-outline-secondary">
          Cerrar Sesión
        </button>
      </div>
      <div>
        <div className={`status-circle status-${status}`} />
        <button onClick={handleClick} disabled={!puedeModificar}>
          {status === 'disponible'
            ? 'Ocupar'
            : status === 'pendiente'
              ? 'Confirmar'
              : 'Ocupado'}
        </button>
      </div>

      <p>Tu rol es: {perfil.ROL_ID_ROL}</p>
    </div>
  );
}
