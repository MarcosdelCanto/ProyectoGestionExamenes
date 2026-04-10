/**
 * helpConfig.js
 * Configuración central de textos de ayuda para cada sección del sistema.
 * Clave: identificador único usado en <HelpModal helpKey="..." />
 *
 * Para agregar ayuda a una nueva sección:
 *   1. Crea una nueva clave aquí con título, descripción e ítems.
 *   2. Usa <HelpModal helpKey="mi_clave" /> o <HelpFab helpKey="mi_clave" /> donde lo necesites.
 */

const helpConfig = {
  // ─── Carga masiva ────────────────────────────────────────────────────────────
  carga_masiva_usuarios: {
    titulo: 'Carga Masiva de Usuarios',
    descripcion:
      'Permite importar alumnos o docentes desde un archivo Excel (.xlsx / .xls) en un solo proceso.',
    secciones: [
      {
        subtitulo: 'Columnas requeridas para Alumnos',
        icono: 'bi-person-fill',
        items: [
          {
            campo: 'Nombre partic.',
            desc: 'Apellido y nombre separados por coma. Ej: "García, Juan"',
          },
          {
            campo: 'Seccion',
            desc: 'Nombre exacto de la sección ya existente en el sistema',
          },
          {
            campo: 'Mail',
            desc: 'Correo electrónico — clave única del usuario',
          },
          {
            campo: 'Abrev.participante',
            desc: 'Contraseña inicial (ej. RUT sin dígito verificador)',
          },
        ],
      },
      {
        subtitulo: 'Columnas requeridas para Docentes',
        icono: 'bi-person-badge-fill',
        items: [
          {
            campo: 'Rut Docente',
            desc: 'RUT del docente (se usa como identificador)',
          },
          { campo: 'Instruct.(den.)', desc: 'Nombre completo del docente' },
          { campo: 'Mail Duoc', desc: 'Correo institucional' },
          { campo: 'Seccion', desc: 'Nombre de la sección a asociar' },
        ],
      },
      {
        subtitulo: 'Comportamiento del proceso',
        icono: 'bi-info-circle-fill',
        items: [
          {
            campo: 'Usuarios nuevos',
            desc: 'Se crean con la contraseña de la columna correspondiente (hasheada)',
          },
          {
            campo: 'Usuarios existentes',
            desc: 'Si el correo ya está registrado, no se sobreescribe su contraseña',
          },
          {
            campo: 'Sección no encontrada',
            desc: 'El usuario se crea pero queda sin sección asociada',
          },
          {
            campo: 'Filas ignoradas',
            desc: 'Filas sin nombre o sin correo son omitidas y contabilizadas',
          },
        ],
      },
    ],
    nota: 'Siempre usa la plantilla oficial de Duoc UC. Verifica que los nombres de sección coincidan exactamente con los registrados en el sistema.',
  },

  // ─── Gestión de reservas ─────────────────────────────────────────────────────
  gestion_reservas: {
    titulo: 'Gestión de Reservas',
    descripcion: 'Administra las reservas de sala para exámenes programados.',
    secciones: [
      {
        subtitulo: 'Acciones disponibles',
        icono: 'bi-gear-fill',
        items: [
          {
            campo: '🟡 Ojo (detalle)',
            desc: 'Ver toda la información de la reserva: examen, sala, módulos y docentes',
          },
          {
            campo: '✏️ Editar',
            desc: 'Modifica fecha, sala, módulos o docentes asignados',
          },
          {
            campo: '🗑️ Cancelar',
            desc: 'Elimina la reserva y devuelve el examen al estado ACTIVO',
          },
          {
            campo: '👥 Alumnos',
            desc: 'Ver la lista de alumnos inscritos en la sección del examen',
          },
        ],
      },
      {
        subtitulo: 'Estados de reserva',
        icono: 'bi-flag-fill',
        items: [
          {
            campo: 'PROGRAMADO',
            desc: 'Reserva creada, pendiente de confirmar por docente',
          },
          { campo: 'ACTIVO', desc: 'Reserva activa y confirmada' },
          { campo: 'EN_CURSO', desc: 'Examen en progreso' },
          { campo: 'FINALIZADO', desc: 'Examen completado' },
          { campo: 'CANCELADO', desc: 'Reserva cancelada' },
        ],
      },
    ],
    nota: 'Solo puedes ver y editar las reservas según los permisos de tu rol.',
  },

  // ─── Exámenes programados ────────────────────────────────────────────────────
  mis_reservas_asignadas: {
    titulo: 'Exámenes Programados',
    descripcion:
      'Visualiza y gestiona los exámenes en los que participas como docente o coordinador.',
    secciones: [
      {
        subtitulo: 'Pestañas',
        icono: 'bi-layout-tabs',
        items: [
          { campo: 'Próximas', desc: 'Exámenes con fecha futura confirmados' },
          {
            campo: 'En revisión',
            desc: 'Reservas pendientes de tu confirmación',
          },
          { campo: 'Pendientes', desc: 'Exámenes asignados sin reserva aún' },
        ],
      },
    ],
    nota: 'Confirma tu asistencia a los exámenes desde la pestaña "En revisión".',
  },

  // ─── Dashboard ───────────────────────────────────────────────────────────────
  dashboard: {
    titulo: 'Panel de Control',
    descripcion: 'Resumen general del sistema con métricas y accesos rápidos.',
    secciones: [
      {
        subtitulo: 'Indicadores',
        icono: 'bi-bar-chart-fill',
        items: [
          {
            campo: 'Exámenes activos',
            desc: 'Total de exámenes en estado ACTIVO sin reserva asignada',
          },
          {
            campo: 'Reservas programadas',
            desc: 'Reservas confirmadas para los próximos días',
          },
          {
            campo: 'Salas ocupadas hoy',
            desc: 'Salas con reserva activa en la fecha actual',
          },
        ],
      },
    ],
    nota: 'Los datos se actualizan en tiempo real.',
  },
};

export default helpConfig;
