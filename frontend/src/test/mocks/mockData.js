export const mockExamenes = [
  {
    ID_EXAMEN: 1,
    NOMBRE_EXAMEN: 'Examen de Programación',
    INSCRITOS_EXAMEN: 25,
    TIPO_PROCESAMIENTO_EXAMEN: 'MANUAL',
    PLATAFORMA_PROSE_EXAMEN: 'CANVAS',
    SITUACION_EVALUATIVA_EXAMEN: 'Final',
    CANTIDAD_MODULOS_EXAMEN: 3,
    SECCION_ID_SECCION: 1,
    ESTADO_ID_EXAMEN: 1,
    NOMBRE_ASIGNATURA: 'Programación Web',
    NOMBRE_SECCION: 'SEC001',
    NOMBRE_ESTADO: 'ACTIVO',
    DERIVED_ESCUELA_ID: '1',
    DERIVED_CARRERA_ID: '2',
    DERIVED_ASIGNATURA_ID: '3',
  },
  {
    ID_EXAMEN: 2,
    NOMBRE_EXAMEN: 'Examen de Bases de Datos',
    INSCRITOS_EXAMEN: 30,
    TIPO_PROCESAMIENTO_EXAMEN: 'AUTOMATICO',
    PLATAFORMA_PROSE_EXAMEN: 'BLACKBOARD',
    SITUACION_EVALUATIVA_EXAMEN: 'Parcial',
    CANTIDAD_MODULOS_EXAMEN: 2,
    SECCION_ID_SECCION: 2,
    ESTADO_ID_EXAMEN: 1,
    NOMBRE_ASIGNATURA: 'Base de Datos',
    NOMBRE_SECCION: 'SEC002',
    NOMBRE_ESTADO: 'ACTIVO',
    DERIVED_ESCUELA_ID: '1',
    DERIVED_CARRERA_ID: '2',
    DERIVED_ASIGNATURA_ID: '4',
  },
];

export const mockSecciones = [
  {
    ID_SECCION: 1,
    CODIGO_SECCION: 'SEC001',
    NOMBRE_SECCION: 'SEC001',
    ASIGNATURA_ID_ASIGNATURA: 3,
  },
  {
    ID_SECCION: 2,
    CODIGO_SECCION: 'SEC002',
    NOMBRE_SECCION: 'SEC002',
    ASIGNATURA_ID_ASIGNATURA: 4,
  },
];

export const mockEstados = [
  { ID_ESTADO: 1, NOMBRE_ESTADO: 'ACTIVO' },
  { ID_ESTADO: 2, NOMBRE_ESTADO: 'PROGRAMADO' },
];

export const mockEscuelas = [
  { ID_ESCUELA: 1, NOMBRE_ESCUELA: 'Escuela de Informática' },
];

export const mockCarreras = [
  {
    ID_CARRERA: 2,
    NOMBRE_CARRERA: 'Ingeniería en Informática',
    ESCUELA_ID_ESCUELA: 1,
  },
];

export const mockAsignaturas = [
  {
    ID_ASIGNATURA: 3,
    NOMBRE_ASIGNATURA: 'Programación Web',
    CARRERA_ID_CARRERA: 2,
  },
  {
    ID_ASIGNATURA: 4,
    NOMBRE_ASIGNATURA: 'Base de Datos',
    CARRERA_ID_CARRERA: 2,
  },
];
