// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';
import './Login.css';

const Login = () => {
  const [email_usuario, setEmail] = useState('');
  const [password_usuario, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para la visibilidad
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    <div className="login-wrapper d-flex align-items-center justify-content-center vh-100">
      {/* Botón flotante para ir al tótem */}
      <Link
        to="/totem"
        className="totem-access-btn position-fixed"
        title="Consulta Pública de Exámenes"
      >
        <i className="fas fa-desktop me-2"></i>
        Tótem prueba
      </Link>

      <div
        className="card p-4 shadow login-card"
        style={{ minWidth: '400px', maxWidth: '450px', width: '100%' }}
      >
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
