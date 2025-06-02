// Paso 1: Importar las funciones de servicio que buscarán los datos de cada reporte.
import {
  getReporteDetalladoExamenes,
  getReporteAlumnosReservas,
} from '../services/reportsService';
// Si tuvieras más reportes, importarías sus funciones aquí.
// import { getReporteAsistencia } from '../services/reportsService';

// =================================================================================

/**
 * @description
 * Define constantes para los tipos de reportes.
 * Usar esto en lugar de strings ('DETALLE_EXAMENES') previene errores de tipeo
 * y facilita la búsqueda de referencias en el código.
 */
export const REPORT_TYPES = {
  DETALLE_EXAMENES: 'DETALLE_EXAMENES',
  ALUMNOS_RESERVAS: 'ALUMNOS_RESERVAS', // <-- NUEVO
  // Ejemplo: Si en el futuro agregas otro reporte
  // REPORTE_ASISTENCIA: 'REPORTE_ASISTENCIA',
};

// =================================================================================

/**
 * @description
 * Objeto de configuración centralizado para todos los reportes de la aplicación.
 * Cada clave del objeto corresponde a un tipo de reporte definido en REPORT_TYPES.
 */
export const reportConfig = {
  [REPORT_TYPES.DETALLE_EXAMENES]: {
    // Título que se mostrará en la página y en el archivo Excel.
    title: 'Reporte Detallado de Exámenes',

    // La función del servicio que se debe llamar para obtener los datos de este reporte.
    serviceFn: getReporteDetalladoExamenes,

    // Define los nombres de los campos de filtro que este reporte utilizará.
    // El componente de filtros usará este array para saber qué selectores/inputs mostrar.
    filterFields: [
      'sede',
      'escuela',
      'carrera',
      'asignatura',
      'jornada',
      'estado',
      'docente',
      'dateRange',
    ],

    // El estado inicial de los filtros para este reporte.
    initialFilters: {
      sedeId: '',
      escuelaId: '',
      carreraId: '',
      asignaturaId: '',
      jornadaId: '',
      fechaDesde: '',
      fechaHasta: '',
      estadoExamenId: '',
      docenteId: '',
    },

    // Los encabezados que se mostrarán en la tabla de resultados.
    tableHeaders: [
      'ID Examen',
      'Examen',
      'Fecha Examen',
      'Hora Inicio',
      'Hora Fin',
      'Docente Asignado',
      'Asignatura',
      'Carrera',
      'Sede',
      'Estado Examen',
      'Inscritos',
    ],

    // Función que mapea un objeto de datos (de la API) al formato deseado
    // para la tabla y la exportación a Excel. Asegura un orden consistente.
    excelMapper: (item) => ({
      'ID Examen': item.ID_EXAMEN,
      Examen: item.NOMBRE_EXAMEN,
      'Fecha Examen': new Date(item.FECHA_RESERVA).toLocaleDateString('es-CL'),
      'Hora Inicio': item.HORA_INICIO,
      'Hora Fin': item.HORA_FIN,
      'Docente Asignado': item.NOMBRE_DOCENTE, // Este campo viene de la nueva lógica
      Asignatura: item.NOMBRE_ASIGNATURA,
      Carrera: item.NOMBRE_CARRERA,
      Sede: item.NOMBRE_SEDE,
      'Estado Examen': item.ESTADO_EXAMEN,
      Inscritos: item.INSCRITOS_EXAMEN,
    }),
  },

  [REPORT_TYPES.ALUMNOS_RESERVAS]: {
    title: 'Reporte de Alumnos y sus Reservas',
    serviceFn: getReporteAlumnosReservas,
    filterFields: [
      'sede',
      'escuela',
      'carrera',
      'jornada',
      'asignatura',
      'seccion',
    ],
    initialFilters: {
      sedeId: '',
      escuelaId: '',
      carreraId: '',
      jornadaId: '',
      asignaturaId: '',
      seccionId: '',
    },
    tableHeaders: [
      'ID Alumno',
      'Nombre Alumno',
      'Email',
      'Examen',
      'Fecha Reserva',
      'Sala',
      'Estado Examen',
      'Asignatura',
      'Carrera',
    ],
    excelMapper: (item) => ({
      'ID Alumno': item.ID_USUARIO,
      'Nombre Alumno': item.NOMBRE_USUARIO,
      Email: item.EMAIL_USUARIO,
      Examen: item.NOMBRE_EXAMEN,
      'Fecha Reserva': new Date(item.FECHA_RESERVA).toLocaleDateString('es-CL'),
      Sala: item.NOMBRE_SALA,
      'Estado Examen': item.ESTADO_EXAMEN,
      Asignatura: item.NOMBRE_ASIGNATURA,
      Carrera: item.NOMBRE_CARRERA,
    }),
  },

  //   ... aquí iría la configuración para tu próximo reporte ...
  [REPORT_TYPES.ALUMNOS_RESERVAS]: {
    title: 'Reporte de Alumnos y sus Reservas',
    serviceFn: getReporteAlumnosReservas,
    filterFields: [
      'sede',
      'escuela',
      'carrera',
      'jornada',
      'asignatura',
      'seccion',
    ],
    initialFilters: {
      sedeId: '',
      escuelaId: '',
      carreraId: '',
      jornadaId: '',
      asignaturaId: '',
      seccionId: '',
    },
    tableHeaders: [
      'ID Alumno',
      'Nombre Alumno',
      'Email',
      'Examen',
      'Fecha Reserva',
      'Hora Inicio',
      'Hora Fin',
      'Sala',
      'Estado Examen',
      'Estado Reserva', // <-- Nueva columna
      'Asignatura',
      'Sección',
      'Carrera',
      'Sede',
      'Jornada',
    ],
    excelMapper: (item) => ({
      'ID Alumno': item.ID_USUARIO,
      'Nombre Alumno': item.NOMBRE_USUARIO,
      Email: item.EMAIL_USUARIO,
      Examen: item.NOMBRE_EXAMEN,
      'Fecha Reserva': item.FECHA_RESERVA
        ? new Date(item.FECHA_RESERVA).toLocaleDateString('es-CL')
        : '',
      'Hora Inicio': item.HORA_INICIO, // <-- Nueva columna
      'Hora Fin': item.HORA_FIN, // <-- Nueva columna
      Sala: item.NOMBRE_SALA,
      'Estado Examen': item.ESTADO_EXAMEN,
      'Estado Reserva': item.ESTADO_RESERVA, // <-- Nueva columna
      Asignatura: item.NOMBRE_ASIGNATURA,
      Sección: item.NOMBRE_SECCION,
      Carrera: item.NOMBRE_CARRERA,
      Sede: item.NOMBRE_SEDE,
      Jornada: item.NOMBRE_JORNADA,
    }),
  },

  // }
};
