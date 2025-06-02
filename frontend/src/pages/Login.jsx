// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import './Login.css';

const Login = () => {
  const [email_usuario, setEmail] = useState('');
  const [password_usuario, setPassword] = useState('');
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

  return (
    <div className="login-wrapper d-flex align-items-center justify-content-center vh-100">
      <div
        className="card p-4 shadow"
        style={{ maxWidth: '400px', width: '100%' }}
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
            <input
              type="password"
              className="form-control"
              id="password_usuario"
              value={password_usuario}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
