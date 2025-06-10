import { useState, useMemo } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  isValid,
} from 'date-fns';
import { es } from 'date-fns/locale';

export function useDateManagement() {
  const [fechaBase, setFechaBase] = useState(new Date());
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  // Función para obtener las fechas de la semana
  const getWeekDates = (currentDate, selectedDate) => {
    if (!isValid(new Date(currentDate))) {
      currentDate = new Date();
    }

    const start = startOfWeek(new Date(currentDate), {
      weekStartsOn: 1, // Lunes
      locale: es,
    });

    const selectedDateStr = selectedDate
      ? format(selectedDate, 'yyyy-MM-dd')
      : null;

    return eachDayOfInterval({
      start,
      end: addDays(start, 6), // 7 días
    })
      .map((date) => {
        const fechaStr = format(date, 'yyyy-MM-dd');
        return {
          fecha: fechaStr,
          diaNumero: format(date, 'd'),
          diaNombre: format(date, 'EEEE', { locale: es }),
          esHoy: fechaStr === format(new Date(), 'yyyy-MM-dd'),
          esSeleccionado: fechaStr === selectedDateStr,
        };
      })
      .filter((fecha) => fecha.diaNombre.toLowerCase() !== 'domingo'); // Sin domingos
  };

  // Calcular fechas automáticamente cuando cambia fechaBase o fechaSeleccionada
  const fechas = useMemo(
    () => getWeekDates(fechaBase, fechaSeleccionada),
    [fechaBase, fechaSeleccionada]
  );

  // Función para cambiar fecha
  const handleDateChange = (newDate) => {
    setFechaSeleccionada(newDate);
    const weekStart = startOfWeek(newDate, {
      weekStartsOn: 1,
      locale: es,
    });
    setFechaBase(weekStart);
  };

  // Función para ir a hoy
  const goToToday = () => {
    const today = new Date();
    handleDateChange(today);
  };

  return {
    fechas,
    fechaSeleccionada,
    handleDateChange,
    goToToday,
  };
}
