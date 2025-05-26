import {
  format,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Obtiene las fechas de la semana (Lunes a Sábado) basada en una fecha dada.
 * @param {Date | string} fechaBase - La fecha base para calcular la semana. Puede ser un objeto Date o un string de fecha.
 * @returns {Array<{dia: string, fecha: string, fechaMostrar: string}>} Un array de objetos,
 *          cada uno representando un día de la semana (Lunes a Sábado)
 *          con su nombre ('Lunes', 'Martes', etc.),
 *          fecha en formato 'yyyy-MM-dd',
 *          y fecha para mostrar en formato 'dd/MM/yyyy'.
 */
export const obtenerFechasDeLaSemana = (fechaBase) => {
  // Asegura que fechaBase sea un objeto Date. Si es un string, se convierte.
  const fechaValida =
    fechaBase instanceof Date ? fechaBase : new Date(fechaBase);

  // Establece el Lunes como inicio de la semana (weekStartsOn: 1 para date-fns)
  const inicioSemana = startOfWeek(fechaValida, { weekStartsOn: 1 });

  // Genera un array de fechas desde el inicio de la semana hasta 5 días después (Lunes a Sábado)
  // addDays(inicioSemana, 5) resulta en 6 días en total: inicioSemana (Lunes) ... Sábado
  const diasDeLaSemana = eachDayOfInterval({
    start: inicioSemana,
    end: addDays(inicioSemana, 5),
  });

  // Mapea cada día (objeto Date) a la estructura deseada con formatos específicos
  return diasDeLaSemana.map((diaDate) => ({
    dia: format(diaDate, 'EEEE', { locale: es }), // Nombre del día en español (ej: "lunes")
    fecha: format(diaDate, 'yyyy-MM-dd'), // Formato estándar para fechas (ej: "2023-10-28")
    fechaMostrar: format(diaDate, 'dd/MM/yyyy'), // Formato común para visualización (ej: "28/10/2023")
  }));
};

/**
 * Calcula la fecha que corresponde a una semana después de la fecha base.
 * @param {Date | string} fechaBase - La fecha actual.
 * @returns {Date} La fecha correspondiente a la semana siguiente.
 */
export const obtenerSemanaSiguiente = (fechaBase) => {
  const fechaValida =
    fechaBase instanceof Date ? fechaBase : new Date(fechaBase);
  return addDays(fechaValida, 7);
};

/**
 * Calcula la fecha que corresponde a una semana antes de la fecha base.
 * @param {Date | string} fechaBase - La fecha actual.
 * @returns {Date} La fecha correspondiente a la semana anterior.
 */
export const obtenerSemanaAnterior = (fechaBase) => {
  const fechaValida =
    fechaBase instanceof Date ? fechaBase : new Date(fechaBase);
  return subDays(fechaValida, 7);
};

// Otras funciones relacionadas con el calendario podrían agregarse aquí.
// Por ejemplo:
// - Funciones para validar si una fecha es un día laborable.
// - Funciones para formatear rangos de fechas de manera específica.
