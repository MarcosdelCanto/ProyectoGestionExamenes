import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../services/api';
import './HomePage.css';
import socket from '../socket';

export default function HomePage() {
  const [status, setStatus] = useState('available');
  const [perfil, setPerfil] = useState(null);
  //carga de perfil

  useEffect(() => {
    // Conectar solo una vez al montar
    socket.connect();

    socket.on('connect', () => console.log('🔗 Conectado:', socket.id));
    socket.on('status-update', (s) => {
      console.log('📶 status-update:', s);
      setStatus(s);
    });

    return () => {
      // Al desmontar, limpia listeners y desconecta
      socket.off('connect');
      socket.off('status-update');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchWithAuth('/api/user/profile')
      .then((res) => res.json())
      .then((data) => setPerfil(data.perfil))
      .catch(console.error);
  }, []);

  //Handlers que despachan el cambio de estado
  const handleReserve = () => {
    console.log('🔥 Enviando change-status → pending');
    socket.emit('change-status', 'pending');
  };
  const handleConfirm = () => {
    console.log('🔥 Enviando change-status → confirmed');
    socket.emit('change-status', 'confirmed');
  };

  if (!perfil) return <p>Cargando perfil…</p>;

  return (
    <div className="homepage-wrapper">
      <h1>Bienvenido, {perfil.NOMBRE_USUARIO}</h1>
      <p>Tu rol es: {perfil.ROL_ID_ROL}</p>

      <div className={`status-circle status-${status}`} />

      {status === 'available' && (
        <button onClick={handleReserve} className="btn btn-success">
          Ocupar
        </button>
      )}
      {status === 'pending' && (
        <button onClick={handleConfirm} className="btn btn-warning">
          Confirmar
        </button>
      )}
      {status === 'confirmed' && (
        <button disabled className="btn btn-danger">
          Ocupado
        </button>
      )}
    </div>
  );
}
