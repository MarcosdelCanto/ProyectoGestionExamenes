import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useMisReservas() {
  const [reservas, setReservas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservas = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/reserva/mis-confirmadas');
      setReservas(response.data);
    } catch (err) {
      setError(err);
      console.error('Error fetching confirmed reservations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  return { reservas, isLoading, error, refetch: fetchReservas };
}
