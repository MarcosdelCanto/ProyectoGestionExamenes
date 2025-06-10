// pages/CrearReservaPage.jsx

import React, { useState, useEffect, useRef } from 'react'; // Importar useRef
import Layout from '../components/Layout';
import { Spinner, Alert } from 'react-bootstrap';
import { crearReservaParaExamenExistenteService } from '../services/reservaService';
import ReservaForm from '../components/reservas/ReservaForm';

const CrearReservaPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formKey, setFormKey] = useState(Date.now());

  // Usaremos una referencia para el contenedor de la página para hacer scroll
  const pageTopRef = useRef(null);

  const handleCreateReserva = async (formDataPayload) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response =
        await crearReservaParaExamenExistenteService(formDataPayload);

      // MEJORA 2: Mensaje de éxito más específico si la API devuelve datos
      const successMessage = response.id_reserva
        ? `Reserva #${response.id_reserva} creada exitosamente.`
        : response.message || 'Reserva creada y programada exitosamente.';

      setSuccess(successMessage);
      setFormKey(Date.now()); // Resetea el formulario

      // MEJORA 1: Hacer scroll hacia arriba para que el usuario vea el mensaje
      pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setError(err.details || err.error || 'Error al crear la reserva.');
      pageTopRef.current?.scrollIntoView({ behavior: 'smooth' }); // También en caso de error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Añadimos la referencia aquí */}
      <div className="container mt-4" ref={pageTopRef}>
        <h2>Crear Reserva para Examen Existente</h2>
        <p className="text-muted">
          Las reservas creadas aquí quedarán en estado "PROGRAMADO" y pendientes
          de confirmación por el docente asignado.
        </p>
        <hr />

        {/* Las alertas se mantienen igual, pero ahora el usuario las verá siempre */}
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
          key={formKey}
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
