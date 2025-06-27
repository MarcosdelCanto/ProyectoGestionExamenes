// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/passwordService';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const data = await forgotPassword(email);
      setMessage(data.mensaje);
      setEmail(''); // Limpiar el campo
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error de conexión. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-wrapper d-flex align-items-center justify-content-center vh-100">
      <div
        className="card p-4 shadow forgot-password-card"
        style={{ minWidth: '400px', maxWidth: '450px', width: '100%' }}
      >
        <div className="text-center mb-4">
          <img
            src="/images/logoduoc.svg.png"
            alt="Logo Duoc UC"
            className="logo-duoc"
          />
        </div>

        <h3 className="text-center mb-4">Recuperar Contraseña</h3>

        <p className="text-muted text-center mb-4">
          Ingresa tu correo electrónico y te enviaremos un enlace para
          restablecer tu contraseña.
        </p>

        {message && (
          <div className="alert alert-success" role="alert">
            <i className="fas fa-check-circle me-2"></i>
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              <i className="fas fa-envelope me-2"></i>
              Correo Electrónico
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="ejemplo@duocuc.cl"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Enviando...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane me-2"></i>
                Enviar Enlace de Recuperación
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-decoration-none">
            <i className="fas fa-arrow-left me-2"></i>
            Volver al Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
