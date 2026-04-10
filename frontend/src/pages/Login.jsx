// src/pages/Login.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';
import { getLoginBackgroundConfig } from '../utils/loginBackgroundConfig';
import './Login.css';

const Login = () => {
  const [email_usuario, setEmail] = useState('');
  const [password_usuario, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para la visibilidad
  const [error, setError] = useState('');
  const [bgConfig, setBgConfig] = useState(() => getLoginBackgroundConfig());
  const navigate = useNavigate();

  useEffect(() => {
    const syncConfig = () => setBgConfig(getLoginBackgroundConfig());
    syncConfig();
    window.addEventListener('storage', syncConfig);
    return () => window.removeEventListener('storage', syncConfig);
  }, []);

  const hexToRgba = (hex, alpha) => {
    const normalized = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#ffffff';
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const wrapperStyle = useMemo(() => {
    if (!bgConfig?.imageUrl) return undefined;

    const alpha = Number(bgConfig.overlayOpacity || 35) / 100;
    return {
      backgroundImage: `linear-gradient(rgba(0, 0, 0, ${alpha}), rgba(0, 0, 0, ${alpha})), url('${bgConfig.imageUrl}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }, [bgConfig]);

  const loginCardStyle = useMemo(
    () => ({
      minWidth: '400px',
      maxWidth: '450px',
      width: '100%',
      backgroundColor: hexToRgba(
        bgConfig?.cardColor || '#ffffff',
        Number(bgConfig?.cardOpacity ?? 98) / 100
      ),
    }),
    [bgConfig]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Llamada al backend a través del servicio authService
      await login(email_usuario, password_usuario);
      // Redirigir al Home tras login exitoso
      navigate('/');
    } catch (err) {
      console.error('Error en login:', err);
      setError('Correo o contraseña incorrectos.');
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      className="login-wrapper d-flex align-items-center justify-content-center vh-100"
      style={wrapperStyle}
    >
      {/* Botón flotante para ir al tótem */}
      <Link
        to="/totem"
        className="totem-access-btn position-fixed"
        title="Consulta Pública de Exámenes"
      >
        <i className="fas fa-desktop me-2"></i>
        Tótem
      </Link>

      <div className="card p-4 shadow login-card" style={loginCardStyle}>
        <div className="text-center mb-4">
          <img
            src="/images/logoduoc.svg.png"
            alt="Logo Duoc"
            className="logo-duoc"
          />
        </div>
        <h3 className="text-center mb-4">Iniciar Sesión</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email_usuario" className="form-label">
              Correo Electrónico
            </label>
            <input
              type="email"
              className="form-control"
              id="email_usuario"
              value={email_usuario}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password_usuario" className="form-label">
              Contraseña
            </label>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'} // Tipo dinámico
                className="form-control"
                id="password_usuario"
                value={password_usuario}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="btn password-toggle-btn" // Cambiado btn-outline-secondary y añadido password-toggle-btn
                type="button"
                id="button-toggle-password"
                onClick={toggleShowPassword}
              >
                {showPassword ? (
                  <i className="bi bi-eye-slash-fill"></i> // Icono de ojo tachado
                ) : (
                  <i className="bi bi-eye-fill"></i> // Icono de ojo
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 mb-3">
            Entrar
          </button>
        </form>

        <div className="text-center">
          <Link to="/forgot-password" className="text-decoration-none">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
