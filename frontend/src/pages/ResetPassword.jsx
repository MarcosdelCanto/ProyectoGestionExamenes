// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyResetToken, resetPassword } from '../services/passwordService';
import './ResetPassword.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    nuevaPassword: '',
    confirmarPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verificar token al cargar el componente
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token de recuperación no válido.');
        setIsTokenValid(false);
        return;
      }

      try {
        const data = await verifyResetToken(token);
        setIsTokenValid(true);
      } catch (err) {
        console.error('Error verificando token:', err);
        setError(err.message || 'Token inválido o expirado.');
        setIsTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar errores al escribir
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.nuevaPassword || !formData.confirmarPassword) {
      setError('Todos los campos son obligatorios.');
      return false;
    }

    if (formData.nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return false;
    }

    if (formData.nuevaPassword !== formData.confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const data = await resetPassword(token, formData.nuevaPassword);
      setMessage(
        'Contraseña actualizada correctamente. Redirigiendo al login...'
      );
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading mientras se verifica el token
  if (isTokenValid === null) {
    return (
      <div className="reset-password-wrapper d-flex align-items-center justify-content-center vh-100">
        <div
          className="card p-4 shadow reset-password-card"
          style={{ minWidth: '400px', maxWidth: '450px', width: '100%' }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Verificando...</span>
            </div>
            <p>Verificando enlace de recuperación...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si el token no es válido
  if (isTokenValid === false) {
    return (
      <div className="reset-password-wrapper d-flex align-items-center justify-content-center vh-100">
        <div
          className="card p-4 shadow reset-password-card"
          style={{ minWidth: '400px', maxWidth: '450px', width: '100%' }}
        >
          <div className="text-center mb-4">
            <img
              src="/images/logoduoc.svg.png"
              alt="Logo Duoc UC"
              className="logo-duoc"
            />
          </div>

          <h3 className="text-center mb-4 text-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Enlace Inválido
          </h3>

          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>

          <div className="text-center">
            <Link to="/forgot-password" className="btn btn-primary me-3">
              <i className="fas fa-redo me-2"></i>
              Solicitar Nuevo Enlace
            </Link>
            <Link to="/login" className="btn btn-outline-secondary">
              <i className="fas fa-arrow-left me-2"></i>
              Volver al Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-wrapper d-flex align-items-center justify-content-center vh-100">
      <div
        className="card p-4 shadow reset-password-card"
        style={{ minWidth: '400px', maxWidth: '450px', width: '100%' }}
      >
        <div className="text-center mb-4">
          <img
            src="/images/logoduoc.svg.png"
            alt="Logo Duoc UC"
            className="logo-duoc"
          />
        </div>

        <h3 className="text-center mb-4">Restablecer Contraseña</h3>

        <p className="text-muted text-center mb-4">
          Ingresa tu nueva contraseña para completar la recuperación.
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
            <label htmlFor="nuevaPassword" className="form-label">
              <i className="fas fa-lock me-2"></i>
              Nueva Contraseña
            </label>
            <div className="position-relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                id="nuevaPassword"
                name="nuevaPassword"
                value={formData.nuevaPassword}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                minLength="6"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                className="btn btn-outline-secondary position-absolute end-0 top-0 h-100"
                style={{ zIndex: 10 }}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="confirmarPassword" className="form-label">
              <i className="fas fa-lock me-2"></i>
              Confirmar Nueva Contraseña
            </label>
            <div className="position-relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-control"
                id="confirmarPassword"
                name="confirmarPassword"
                value={formData.confirmarPassword}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                placeholder="Repite la contraseña"
              />
              <button
                type="button"
                className="btn btn-outline-secondary position-absolute end-0 top-0 h-100"
                style={{ zIndex: 10 }}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                <i
                  className={`fas fa-eye${showConfirmPassword ? '-slash' : ''}`}
                ></i>
              </button>
            </div>
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
                Actualizando...
              </>
            ) : (
              <>
                <i className="fas fa-check me-2"></i>
                Actualizar Contraseña
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

export default ResetPassword;
