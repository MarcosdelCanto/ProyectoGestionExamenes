import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout'; // Ajusta la ruta a tu componente Layout
import { Spinner, Alert } from 'react-bootstrap';
import { crearReservaParaExamenExistenteService } from '../services/reservaService';
import ReservaForm from '../components/reservas/ReservaForm'; // Importa el formulario reutilizable

const CrearReservaPage = () => {
  const [loading, setLoading] = useState(false); // Para el submit del formulario
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formKey, setFormKey] = useState(Date.now()); // Para resetear el formulario

  const handleCreateReserva = async (formDataPayload) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response =
        await crearReservaParaExamenExistenteService(formDataPayload);
      setSuccess(
        response.message ||
          'Reserva creada y PROGRAMADO exitosamente, pendiente de confirmación docente.'
      );
      setFormKey(Date.now()); // Cambia la key para forzar el re-renderizado y reseteo de ReservaForm
    } catch (err) {
      setError(err.details || err.error || 'Error al crear la reserva.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mt-4">
        <h2>Crear Reserva para Examen Existente</h2>
        <p className="text-muted">
          Las reservas creadas aquí quedarán en estado "PROGRAMADO" y pendientes
          de confirmación por el docente asignado.
        </p>
        <hr />
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}

        <ReservaForm
          key={formKey} // Usar key para resetear el estado interno del formulario
          onSubmit={handleCreateReserva}
          isLoadingExternally={loading}
          submitButtonText="Crear Reserva"
          isEditMode={false}
        />
      </div>
    </Layout>
  );
};

export default CrearReservaPage;
