import React, { useState, useEffect } from 'react';
import { changeStatus } from '../store/statusSlice';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWithAuth } from '../services/api';
import './HomePage.css';

export default function HomePage() {
  const status = useSelector((state) => state.status);
  const dispatch = useDispatch();
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    fetchWithAuth('/api/user/profile')
      .then((res) => res.json())
      .then((data) => setPerfil(data.perfil))
      .catch(console.error);
  }, []);

  //Handlers que despachan el cambio de estado
  const handleReserve = () => {
    console.log('👉 dispatch(changeStatus("pendiente"))');
    dispatch(changeStatus('pendiente'));
  };
  const handleConfirm = () => {
    console.log('👉 dispatch(changeStatus("confirmada"))');
    dispatch(changeStatus('confirmada'));
  };

  if (!perfil) return <p>Cargando perfil…</p>;

  return (
    <div className="homepage-wrapper">
      <h1>Bienvenido, {perfil.NOMBRE_USUARIO}</h1>
      <p>Tu rol es: {perfil.ROL_ID_ROL}</p>

      <div className={`status-circle status-${status}`} />

      {status === 'disponible' && (
        <button onClick={handleReserve} className="btn btn-success">
          Ocupar
        </button>
      )}
      {status === 'pendiente' && (
        <button onClick={handleConfirm} className="btn btn-warning">
          Confirmar
        </button>
      )}
      {status === 'confirmada' && (
        <button disabled className="btn btn-danger">
          Ocupado
        </button>
      )}
    </div>
  );
}
