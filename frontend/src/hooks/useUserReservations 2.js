import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Hook dedicado para obtener las reservas confirmadas del usuario logueado y los módulos necesarios para el calendario.
 * Encapsula la lógica de fetching, estados de carga y manejo de errores.
 */
export const useUserReservations = () => {
  const [data, setData] = useState({
    reservas: [],
    modulos: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [reservasResponse, modulosResponse] = await Promise.all([
          api.get('/reserva/mis-confirmadas'),
          api.get('/modulos'),
        ]);

        const reservasData = Array.isArray(reservasResponse.data)
          ? reservasResponse.data
          : reservasResponse.data.reservas || [];
        const modulosData = Array.isArray(modulosResponse.data)
          ? modulosResponse.data
          : modulosResponse.data.modulos || [];

        setData({ reservas: reservasData, modulos: modulosData });
      } catch (err) {
        console.error('Error fetching user reservations data:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { ...data, isLoading, error };
};
