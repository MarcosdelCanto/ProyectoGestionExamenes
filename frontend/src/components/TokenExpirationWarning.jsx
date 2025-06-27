// src/components/TokenExpirationWarning.jsx
import React, { useState, useEffect } from 'react';
import {
  getCurrentUser,
  refreshAccessToken,
  logout,
} from '../services/authService';

const TokenExpirationWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const checkTokenExpiration = () => {
      const user = getCurrentUser();

      if (!user.isAuthenticated) {
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      try {
        // Decodificar el token JWT para obtener la fecha de expiración
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convertir a milisegundos
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;

        // Mostrar advertencia si quedan menos de 2 minutos
        if (timeUntilExpiration > 0 && timeUntilExpiration <= 2 * 60 * 1000) {
          setTimeLeft(Math.floor(timeUntilExpiration / 1000));
          setShowWarning(true);
        } else {
          setShowWarning(false);
        }
      } catch (error) {
        console.error('Error al decodificar token:', error);
      }
    };

    // Verificar cada 30 segundos
    const interval = setInterval(checkTokenExpiration, 30000);

    // Verificar inmediatamente
    checkTokenExpiration();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showWarning && timeLeft > 0) {
      const countdown = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setShowWarning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [showWarning, timeLeft]);

  const handleRefreshToken = async () => {
    try {
      await refreshAccessToken();
      setShowWarning(false);
    } catch (error) {
      console.error('Error al refrescar token:', error);
      logout();
      window.location.href = '/login';
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div
      className="position-fixed top-0 start-50 translate-middle-x mt-3"
      style={{ zIndex: 9999 }}
    >
      <div
        className="alert alert-warning alert-dismissible d-flex align-items-center shadow"
        role="alert"
      >
        <i className="fas fa-exclamation-triangle me-2"></i>
        <div className="flex-grow-1">
          <strong>Sesión próxima a expirar</strong>
          <br />
          <small>Tu sesión expirará en {formatTime(timeLeft)}</small>
        </div>
        <div className="ms-3">
          <button
            type="button"
            className="btn btn-outline-warning btn-sm me-2"
            onClick={handleRefreshToken}
          >
            <i className="fas fa-sync-alt me-1"></i>
            Extender Sesión
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt me-1"></i>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenExpirationWarning;
