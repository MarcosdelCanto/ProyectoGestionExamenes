import React, { useState, useEffect } from 'react';
import { changeStatus } from '../store/statusSlice';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import { logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { socket } from '../store/socketMiddleware';
import Layout from '../components/Layout';

export default function HomePage() {
  const { status, updaterId } = useSelector((state) => state.status);
  const dispatch = useDispatch();
  const [perfil, setPerfil] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api('/user/profile')
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
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">
          Bienvenido, {perfil.NOMBRE_USUARIO}
        </h1>
        <p className="text-lg">Tu rol es: {perfil.ROL_ID_ROL}</p>
        {/* Aquí puedes agregar más contenido relacionado con el perfil */}
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
    </Layout>
  );
}
