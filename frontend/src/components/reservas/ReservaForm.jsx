// src/components/reservas/ReservaForm.jsx

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import {
  Form,
  Button,
  Row,
  Col,
  Spinner,
  Alert,
  InputGroup,
} from 'react-bootstrap';

// --- Servicios ---
import { fetchUserActiveExams } from '../../services/examenService';
import { fetchAllSedes } from '../../services/sedeService';
import { fetchAllEdificios } from '../../services/edificioService';
import { fetchAllSalas } from '../../services/salaService';
import { fetchAllEscuelas } from '../../services/escuelaService';
import { fetchAllCarreras } from '../../services/carreraService';
import { fetchAllAsignaturas } from '../../services/asignaturaService';
import { fetchAllEstados } from '../../services/estadoService';
import { fetchAvailableModules } from '../../services/moduloService';
import {
  searchDocentes,
  fetchDocentesBySeccion,
} from '../../services/usuarioService';
import { fetchAllSecciones } from '../../services/seccionService';

// --- Modales de Filtro ---
import FilterModalSalas from '../calendario/FilterModalSalas';
import FilterModalExamenes from '../examenes/FilterModalExamenes';

// --- Componentes de Estilo y Formato ---
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? '#0d6efd' : '#ced4da',
    boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, .25)' : null,
    '&:hover': {
      borderColor: state.isFocused ? '#0d6efd' : '#adb5bd',
    },
    transition: 'border-color .15s ease-in-out,box-shadow .15s ease-in-out',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#0d6efd'
      : state.isFocused
        ? '#e9ecef'
        : null,
    color: state.isSelected ? 'white' : 'black',
  }),
};

const formatDocenteOptionLabel = ({ label, SECCIONES }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <span>{label}</span>
    {SECCIONES && (
      <span style={{ fontSize: '0.8em', color: '#6c757d' }}>{SECCIONES}</span>
    )}
  </div>
);
// --- Componente Principal del Formulario ---
const ReservaForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  isLoadingExternally = false,
  submitButtonText = 'Guardar',
  isEditMode = false,
  onModulosChange,
}) => {
  // --- Estados del formulario ---
  // Estados para almacenar los valores originales de la reserva en modo edición
  const [originalFechaReserva, setOriginalFechaReserva] = useState('');
  const [originalSalaValue, setOriginalSalaValue] = useState(null); // Solo el ID/value de la sala original

  const [examen, setExamen] = useState(null);
  const [sala, setSala] = useState(null);
  const [docente, setDocente] = useState(null);
  const [fechaReserva, setFechaReserva] = useState('');
  const [modulosIds, setModulosIds] = useState([]);

  // --- Estados para cargar datos y opciones ---
  const [examenesOptions, setExamenesOptions] = useState([]);
  const [salasOptions, setSalasOptions] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [defaultDocenteOptions, setDefaultDocenteOptions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [error, setError] = useState(null);

  // --- Estados para los filtros ---
  const [isSalaFilterOpen, setSalaFilterOpen] = useState(false);
  const [isExamenFilterOpen, setExamenFilterOpen] = useState(false);
  const [allSalas, setAllSalas] = useState([]);
  const [allExamenes, setAllExamenes] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [estados, setEstados] = useState([]);
  const [salaFilters, setSalaFilters] = useState({
    selectedSede: '',
    selectedEdificio: '',
  });
  const [examenFilters, setExamenFilters] = useState({
    selectedSede: '',
    selectedEscuela: '',
    selectedCarrera: '',
    selectedAsignatura: '',
    selectedEstado: '',
  });

  // --- Handlers para cambios en filtros de examen que resetean dependientes ---
  const handleExamenSedeChange = (value) => {
    setExamenFilters((prev) => ({
      ...prev,
      selectedSede: value,
      selectedEscuela: '', // Resetear dependientes
      selectedCarrera: '',
      selectedAsignatura: '',
    }));
  };
  const handleExamenEscuelaChange = (value) => {
    setExamenFilters((prev) => ({
      ...prev,
      selectedEscuela: value,
      selectedCarrera: '', // Resetear dependientes
      selectedAsignatura: '',
    }));
  };
  const handleExamenCarreraChange = (value) => {
    setExamenFilters((prev) => ({
      ...prev,
      selectedCarrera: value,
      selectedAsignatura: '', // Resetear dependiente
    }));
  };
  const handleExamenAsignaturaChange = (value) => {
    setExamenFilters((prev) => ({ ...prev, selectedAsignatura: value }));
  };
  const handleExamenEstadoChange = (value) => {
    setExamenFilters((prev) => ({ ...prev, selectedEstado: value }));
  };

  // --- Efecto para cargar datos iniciales ---
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const [
          examenesData,
          salasData,
          sedesData,
          edificiosData,
          escuelasData,
          carrerasData,
          asignaturasData,
          estadosData,
          seccionesData,
        ] = await Promise.all([
          fetchUserActiveExams(),
          fetchAllSalas(),
          fetchAllSedes(),
          fetchAllEdificios(),
          fetchAllEscuelas(),
          fetchAllCarreras(),
          fetchAllAsignaturas(),
          fetchAllEstados(),
          fetchAllSecciones(),
        ]);

        // 1. Enriquecer los exámenes del usuario con IDs de jerarquía
        const examenesConJerarquia = examenesData.map((ex) => {
          let asignatura = null;
          if (ex.ID_ASIGNATURA) {
            asignatura = asignaturasData.find(
              (a) => String(a.ID_ASIGNATURA) === String(ex.ID_ASIGNATURA)
            );
          } else if (ex.NOMBRE_ASIGNATURA) {
            asignatura = asignaturasData.find(
              (a) =>
                String(a.NOMBRE_ASIGNATURA).trim().toUpperCase() ===
                String(ex.NOMBRE_ASIGNATURA).trim().toUpperCase()
            );
          }

          const carrera = asignatura
            ? carrerasData.find(
                (c) =>
                  String(c.ID_CARRERA) === String(asignatura.CARRERA_ID_CARRERA)
              )
            : null;
          const escuela = carrera
            ? escuelasData.find(
                (e) =>
                  String(e.ID_ESCUELA) === String(carrera.ESCUELA_ID_ESCUELA)
              )
            : null;
          const sedeIdExamen = escuela ? escuela.SEDE_ID_SEDE : null;

          return {
            ...ex,
            value: ex.ID_EXAMEN,
            label: `${ex.NOMBRE_EXAMEN} (Inscritos: ${ex.INSCRITOS_EXAMEN || 'N/A'}) ${ex.CANTIDAD_MODULOS_EXAMEN ? `- Módulos: ${ex.CANTIDAD_MODULOS_EXAMEN}` : ''}`,
            seccionId: ex.ID_SECCION,
            ASIGNATURA_ID_DERIVADA: asignatura
              ? parseInt(asignatura.ID_ASIGNATURA, 10)
              : null,
            CARRERA_ID_DERIVADA: carrera
              ? parseInt(carrera.ID_CARRERA, 10)
              : null,
            ESCUELA_ID_DERIVADA: escuela
              ? parseInt(escuela.ID_ESCUELA, 10)
              : null,
            SEDE_ID_DERIVADA: sedeIdExamen ? parseInt(sedeIdExamen, 10) : null,
            ESTADO_ID_EXAMEN: ex.ESTADO_ID_ESTADO
              ? parseInt(ex.ESTADO_ID_ESTADO, 10)
              : null,
          };
        });

        setAllExamenes(examenesConJerarquia);
        setExamenesOptions(examenesConJerarquia);

        const idsSedesUsuario = new Set(
          examenesConJerarquia
            .map((ex) => ex.SEDE_ID_DERIVADA)
            .filter((id) => id !== null)
        );
        const idsEscuelasUsuario = new Set(
          examenesConJerarquia
            .map((ex) => ex.ESCUELA_ID_DERIVADA)
            .filter((id) => id !== null)
        );
        const idsCarrerasUsuario = new Set(
          examenesConJerarquia
            .map((ex) => ex.CARRERA_ID_DERIVADA)
            .filter((id) => id !== null)
        );
        const idsAsignaturasUsuario = new Set(
          examenesConJerarquia
            .map((ex) => ex.ASIGNATURA_ID_DERIVADA)
            .filter((id) => id !== null)
        );

        const sedesPermitidas = sedesData.filter((s) =>
          idsSedesUsuario.has(s.ID_SEDE)
        );
        const escuelasPermitidas = escuelasData.filter((e) =>
          idsEscuelasUsuario.has(e.ID_ESCUELA)
        );
        const carrerasPermitidas = carrerasData.filter((c) =>
          idsCarrerasUsuario.has(c.ID_CARRERA)
        );
        const asignaturasPermitidas = asignaturasData.filter((a) =>
          idsAsignaturasUsuario.has(a.ID_ASIGNATURA)
        );

        setSedes(sedesPermitidas.length > 0 ? sedesPermitidas : sedesData);
        setEscuelas(
          escuelasPermitidas.length > 0 ? escuelasPermitidas : escuelasData
        );
        setCarreras(
          carrerasPermitidas.length > 0 ? carrerasPermitidas : carrerasData
        );
        setAsignaturas(
          asignaturasPermitidas.length > 0
            ? asignaturasPermitidas
            : asignaturasData
        );

        setAllSalas(salasData);
        setSalasOptions(
          salasData.map((s) => ({ value: s.ID_SALA, label: s.NOMBRE_SALA }))
        );

        // Edificios, Estados y Secciones se setean con los datos completos
        // ya que no dependen directamente de los exámenes del usuario para los filtros actuales
        // o son listas maestras generales.
        setEdificios(edificiosData);
        setEstados(estadosData);
        setSecciones(seccionesData);
      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
        setError('Error al cargar datos esenciales.');
      } finally {
        setLoadingData(false);
      }
    };

    if (!isEditMode) {
      cargarDatosIniciales();
    } else if (initialData) {
      const cargarListasMaestrasParaEdicion = async () => {
        setLoadingData(true);
        setError(null); // Limpiar errores previos
        try {
          const [
            sedesData,
            edificiosData,
            escuelasData,
            carrerasData,
            asignaturasData,
            estadosData,
            seccionesData,
            salasData,
            examenesDelUsuario,
          ] = await Promise.all([
            fetchAllSedes(),
            fetchAllEdificios(),
            fetchAllEscuelas(),
            fetchAllCarreras(),
            fetchAllAsignaturas(),
            fetchAllEstados(),
            fetchAllSecciones(),
            fetchAllSalas(),
            fetchUserActiveExams(), // Asegúrate que esto traiga el examen actual si es necesario
          ]);

          setSedes(sedesData);
          setEdificios(edificiosData);
          setEscuelas(escuelasData);
          setCarreras(carrerasData);
          setAsignaturas(asignaturasData);
          setEstados(estadosData);
          setSecciones(seccionesData);

          const formattedSalasOptions = salasData.map((s) => ({
            value: s.ID_SALA,
            label: s.NOMBRE_SALA,
          }));
          setAllSalas(salasData); // Guardar todas las salas para filtros
          setSalasOptions(formattedSalasOptions);

          const examenesConFormato = examenesDelUsuario.map((ex) => ({
            ...ex, // Mantener otros datos del examen si son necesarios
            value: ex.ID_EXAMEN,
            label: `${ex.NOMBRE_EXAMEN} (Inscritos: ${ex.INSCRITOS_EXAMEN || 'N/A'}) ${ex.CANTIDAD_MODULOS_EXAMEN ? `- Módulos: ${ex.CANTIDAD_MODULOS_EXAMEN}` : ''}`,
            seccionId: ex.ID_SECCION, // Asegúrate que seccionId esté aquí si lo usas después
          }));
          setAllExamenes(examenesConFormato);
          setExamenesOptions(examenesConFormato);

          console.log(
            '[ReservaForm Edit Mode] Raw initialData received:',
            JSON.parse(JSON.stringify(initialData))
          );

          // Poblar el formulario con initialData
          // Para Examen:
          if (initialData.examen && initialData.examen.value) {
            const examenEncontrado = examenesConFormato.find(
              (opt) => opt.value === initialData.examen.value
            );
            setExamen(examenEncontrado || initialData.examen); // Usar el objeto de options si se encuentra, sino el de initialData
          } else {
            setExamen(null);
          }

          // Para Sala:
          if (initialData.sala && initialData.sala.value) {
            const salaEncontrada = formattedSalasOptions.find(
              (opt) => opt.value === initialData.sala.value
            );
            setSala(salaEncontrada || initialData.sala); // Usar el objeto de options si se encuentra
          } else {
            setSala(null);
          }

          // Para Docente:
          // MisReservasAsignadasPage envía 'docentes' como un array [{value, label}]
          // ReservaForm espera un solo objeto para el estado 'docente'
          if (initialData.docentes && initialData.docentes.length > 0) {
            // Asumimos que el primer docente del array es el que se debe seleccionar
            // Si searchDocentes no devuelve el docente actual en defaultOptions,
            // el AsyncSelect podría no mostrarlo inicialmente si no está en defaultOptions.
            // Para AsyncSelect, el 'value' debe ser un objeto {value, label, ...}
            // y es mejor si defaultDocenteOptions se puebla con esta opción si es posible.
            const docentePrincipal = initialData.docentes[0];
            setDocente(docentePrincipal);
            // Opcionalmente, añadirlo a defaultDocenteOptions si no está
            setDefaultDocenteOptions((prevOptions) => {
              const existe = prevOptions.some(
                (opt) => opt.value === docentePrincipal.value
              );
              return existe ? prevOptions : [docentePrincipal, ...prevOptions];
            });
          } else if (initialData.docente) {
            // Fallback por si acaso se envía 'docente' singular
            setDocente(initialData.docente);
            setDefaultDocenteOptions((prevOptions) => {
              const existe = prevOptions.some(
                (opt) => opt.value === initialData.docente.value
              );
              return existe
                ? prevOptions
                : [initialData.docente, ...prevOptions];
            });
          } else {
            setDocente(null);
          }

          setFechaReserva(initialData.fechaReserva || '');
          setOriginalFechaReserva(initialData.fechaReserva || '');
          setOriginalSalaValue(initialData.sala?.value || null);

          setModulosIds(initialData.modulosIds || []);

          console.log(
            '[ReservaForm Edit Mode] States after processing initialData:',
            {
              examen: initialData.examen, // Loguear lo que se intentó setear
              sala: initialData.sala, // Loguear lo que se intentó setear
              docente: initialData.docentes
                ? initialData.docentes[0]
                : initialData.docente, // Loguear lo que se intentó setear
              fechaReserva: initialData.fechaReserva,
              modulosIds: initialData.modulosIds,
            }
          );
        } catch (err) {
          console.error('Error al cargar listas maestras para edición:', err);
          setError(
            'Error al cargar datos para edición. ' + (err.message || '')
          );
        } finally {
          setLoadingData(false);
        }
      };
      cargarListasMaestrasParaEdicion();
    } else {
      setLoadingData(false);
    }
  }, [isEditMode, initialData]); // Dejar solo estas dependencias si la carga de opciones es robusta

  // --- Efectos dinámicos ---
  useEffect(() => {
    // Cargar docentes por defecto solo en modo creación y si hay un examen seleccionado
    if (!isEditMode && examen?.seccionId) {
      fetchDocentesBySeccion(examen.seccionId)
        .then((docentesData) => {
          const opciones = docentesData.map((d) => ({
            value: d.ID_USUARIO,
            label: d.NOMBRE_USUARIO,
            SECCIONES: d.SECCIONES,
          }));
          setDefaultDocenteOptions(opciones);
          // No setear docente automáticamente aquí si ya hay uno de initialData en modo edición
          if (!docente) {
            // Solo setear si no hay docente ya (ej. de initialData)
            setDocente(opciones.length > 0 ? opciones[0] : null);
          }
        })
        .catch(() => {
          setDefaultDocenteOptions([]);
          if (!docente) {
            // Solo setear si no hay docente ya
            setDocente(null);
          }
        });
    } else if (
      isEditMode &&
      initialData &&
      initialData.docentes &&
      initialData.docentes.length > 0 &&
      !docente
    ) {
      // Si estamos en modo edición, tenemos initialData.docentes, pero el estado 'docente' aún es null
      // (podría pasar si la lógica anterior no lo seteó o fue limpiado), intentamos setearlo.
      const docentePrincipal = initialData.docentes[0];
      setDocente(docentePrincipal);
      setDefaultDocenteOptions((prevOptions) => {
        const existe = prevOptions.some(
          (opt) => opt.value === docentePrincipal.value
        );
        return existe ? prevOptions : [docentePrincipal, ...prevOptions];
      });
    } else if (!examen?.seccionId && !isEditMode) {
      setDefaultDocenteOptions([]);
      setDocente(null);
    }
  }, [examen, isEditMode, initialData]); // 'docente' fue removido de las dependencias para evitar bucles si se setea aquí mismo.

  useEffect(() => {
    if (fechaReserva && sala?.value) {
      setLoadingModules(true);
      // No limpiar modulos aquí, se limpian más abajo si es necesario
      // setModulos([]);

      let resetearModulos = false;
      if (!isEditMode) {
        resetearModulos = true;
      } else {
        // En modo edición, resetear si la fecha o la sala cambian respecto a los originales
        // O si los módulos iniciales no estaban definidos (lo que implica que es la primera carga con fecha y sala)
        if (
          fechaReserva !== originalFechaReserva ||
          sala?.value !== originalSalaValue ||
          (initialData && typeof initialData.modulosIds === 'undefined') // Si initialData existe pero no trajo modulosIds
        ) {
          resetearModulos = true;
        }
      }

      if (resetearModulos) {
        setModulosIds([]);
        console.log(
          '[ReservaForm Modulos Effect] modulosIds reseteados. Causa:',
          {
            isEditMode,
            fechaReserva,
            originalFechaReserva,
            salaValue: sala?.value,
            originalSalaValue,
            initialModulosUndefined:
              initialData && typeof initialData.modulosIds === 'undefined',
          }
        );
      }

      console.log(
        '[ReservaForm Modulos Effect] Llamando a fetchAvailableModules con:',
        {
          fecha: fechaReserva,
          idSala: sala.value,
          idReservaExcluir: isEditMode ? initialData?.ID_RESERVA : null,
        }
      );
      fetchAvailableModules(
        fechaReserva,
        sala.value,
        isEditMode ? initialData?.ID_RESERVA : null
      )
        .then((data) => {
          setModulos(data);
          if (isEditMode && !resetearModulos && initialData?.modulosIds) {
            setModulosIds(initialData.modulosIds);
          }
        })
        .catch((error) => {
          console.error('[ReservaForm] Error al cargar módulos:', error);
          setError(
            'No se pudieron cargar los módulos: ' +
              (error.message || error.error || 'Error desconocido')
          );
        })
        .finally(() => setLoadingModules(false));
    } else {
      setModulos([]);
      if (!isEditMode) {
        setModulosIds([]);
      }
    }
  }, [
    fechaReserva,
    sala,
    isEditMode,
    originalFechaReserva,
    originalSalaValue,
    initialData,
    // resetearModulos, // Si resetearModulos se calcula dentro, no necesita ser dependencia
  ]); // Añadir dependencias relevantes

  // --- Funciones auxiliares ---
  const isTimePassed = (moduleStartTimeString) => {
    if (!moduleStartTimeString) return false;
    const now = new Date();
    const moduleTime = new Date(now); // Clonar fecha actual
    const [hours, minutes] = moduleStartTimeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return false; // Formato de hora inválido

    moduleTime.setHours(hours, minutes, 0, 0);

    return now > moduleTime;
  };

  // --- Lógica de Módulos ---
  const isModuleDisabled = (currentModule) => {
    // Validar si el módulo es para una fecha y hora pasada
    if (
      fechaReserva === new Date().toISOString().split('T')[0] &&
      isTimePassed(currentModule.INICIO_MODULO)
    ) {
      return true;
    }

    if (modulosIds.length === 0) return false;
    if (modulosIds.includes(currentModule.ID_MODULO)) return false; // Si ya está seleccionado, no está deshabilitado para deselección

    const selectedModulesCurrent = modulos.filter((m) =>
      modulosIds.includes(m.ID_MODULO)
    );
    if (selectedModulesCurrent.length === 0) return false; // Si no hay nada seleccionado, nada está deshabilitado

    const selectedOrdens = selectedModulesCurrent
      .map((m) => Number(m.ORDEN))
      .filter((o) => !isNaN(o)); // Asegurarse de que solo se procesen números válidos

    if (selectedOrdens.length === 0) return false; // Si no hay órdenes válidas, no deshabilitar

    const minOrden = Math.min(...selectedOrdens);
    const maxOrden = Math.max(...selectedOrdens);

    return !(
      Number(currentModule.ORDEN) === minOrden - 1 ||
      Number(currentModule.ORDEN) === maxOrden + 1
    );
  };

  const handleModuloChange = (e) => {
    const clickedId = Number(e.target.value);
    const isChecked = e.target.checked;

    if (isChecked) {
      // Al seleccionar, añadir el módulo
      setModulosIds((prev) =>
        [...new Set([...prev, clickedId])].sort((a, b) => {
          const ordenA = modulos.find((m) => m.ID_MODULO === a)?.ORDEN || 0;
          const ordenB = modulos.find((m) => m.ID_MODULO === b)?.ORDEN || 0;
          return Number(ordenA) - Number(ordenB);
        })
      );
    } else {
      // Al deseleccionar, lógica para mantener la consecutividad
      const clickedModule = modulos.find((m) => m.ID_MODULO === clickedId);
      if (!clickedModule) return;

      const clickedOrden = Number(clickedModule.ORDEN);
      const currentlySelectedModules = modulos
        .filter((m) => modulosIds.includes(m.ID_MODULO))
        .sort((a, b) => Number(a.ORDEN) - Number(b.ORDEN));

      const newSelectedIds = [];
      let breakSequence = false;
      for (const mod of currentlySelectedModules) {
        if (mod.ID_MODULO === clickedId) {
          breakSequence = true; // A partir de aquí, los módulos ya no son parte de la secuencia continua
          continue; // No incluir el módulo deseleccionado
        }
        if (breakSequence) {
          // Si ya se rompió la secuencia y este módulo no es el deseleccionado,
          // y su orden es mayor al deseleccionado, entonces también se deselecciona.
          // Esto maneja el caso de deseleccionar un módulo intermedio.
          if (Number(mod.ORDEN) > clickedOrden) {
            continue;
          }
        }
        newSelectedIds.push(mod.ID_MODULO);
      }

      // Si al deseleccionar un módulo intermedio se rompe la continuidad,
      // puede que necesitemos una lógica más sofisticada para decidir qué parte de la secuencia mantener.
      // La lógica actual prioriza mantener la secuencia desde el inicio hasta antes del módulo deseleccionado.
      // Si se deselecciona el primero o el último, simplemente se quita.
      const selectedOrdens = currentlySelectedModules.map((m) =>
        Number(m.ORDEN)
      );
      if (
        selectedOrdens.length > 0 &&
        (clickedOrden === Math.min(...selectedOrdens) ||
          clickedOrden === Math.max(...selectedOrdens))
      ) {
        setModulosIds((prev) => prev.filter((id) => id !== clickedId));
      } else {
        // Si se deselecciona uno intermedio, mantener solo los anteriores al deseleccionado
        // o ajustar para mantener la secuencia más larga posible.
        // Por simplicidad, la lógica actual puede resultar en deseleccionar más de lo esperado.
        // Una mejora sería permitir al usuario decidir qué bloque mantener o re-seleccionar.
        // La lógica de 'newSelectedIds' intenta manejar esto, pero puede ser compleja.
        // Una aproximación más simple al deseleccionar un intermedio:
        // deseleccionar todos los que tengan un orden mayor al deseleccionado.
        setModulosIds(
          modulosIds.filter((id) => {
            const mod = modulos.find((m) => m.ID_MODULO === id);
            return mod && Number(mod.ORDEN) < clickedOrden;
          })
        );
      }
    }
  };

  // --- Handlers ---
  const handleApplySalaFilters = () => {
    let filteredSalas = [...allSalas];
    const { selectedSede, selectedEdificio } = salaFilters;

    if (selectedSede) {
      const edificiosDeSede = edificios
        .filter((e) => e.SEDE_ID_SEDE === parseInt(selectedSede))
        .map((e) => e.ID_EDIFICIO);
      filteredSalas = filteredSalas.filter((s) =>
        edificiosDeSede.includes(s.EDIFICIO_ID_EDIFICIO)
      );
    }

    if (selectedEdificio) {
      filteredSalas = filteredSalas.filter(
        (s) => s.EDIFICIO_ID_EDIFICIO === parseInt(selectedEdificio)
      );
    }

    setSalasOptions(
      filteredSalas.map((s) => ({ value: s.ID_SALA, label: s.NOMBRE_SALA }))
    );
    setSala(null);
    setSalaFilterOpen(false);
  };

  const handleApplyExamenFilters = () => {
    let filteredExamenes = [...allExamenes]; // allExamenes ya debería estar enriquecido
    const {
      selectedSede,
      selectedEscuela,
      selectedCarrera,
      selectedAsignatura,
      selectedEstado,
    } = examenFilters;

    if (selectedSede) {
      filteredExamenes = filteredExamenes.filter(
        (ex) => ex.SEDE_ID_DERIVADA === parseInt(selectedSede, 10)
      );
    }
    if (selectedEscuela) {
      filteredExamenes = filteredExamenes.filter(
        (ex) => ex.ESCUELA_ID_DERIVADA === parseInt(selectedEscuela, 10)
      );
    }
    if (selectedCarrera) {
      filteredExamenes = filteredExamenes.filter(
        (ex) => ex.CARRERA_ID_DERIVADA === parseInt(selectedCarrera, 10)
      );
    }
    if (selectedAsignatura) {
      filteredExamenes = filteredExamenes.filter(
        (ex) => ex.ASIGNATURA_ID_DERIVADA === parseInt(selectedAsignatura, 10)
      );
    }
    if (selectedEstado) {
      filteredExamenes = filteredExamenes.filter(
        (ex) => ex.ESTADO_ID_EXAMEN === parseInt(selectedEstado, 10)
      );
    }

    setExamenesOptions(filteredExamenes);
    setExamen(null);
    setExamenFilterOpen(false);
  };

  const handleLimpiarExamenFilters = () => {
    setExamenFilters({
      selectedSede: '',
      selectedEscuela: '',
      selectedCarrera: '',
      selectedAsignatura: '',
      selectedEstado: '',
    });
    setExamenesOptions(allExamenes); // allExamenes ya está enriquecido
    setExamen(null);
  };

  const loadDocenteOptions = (inputValue, callback) => {
    if (!inputValue) {
      callback([]);
      return;
    }
    searchDocentes(inputValue).then((data) => {
      callback(
        data.map((d) => ({
          value: d.ID_USUARIO,
          label: d.NOMBRE_USUARIO,
          SECCIONES: d.SECCIONES,
        }))
      );
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(
      '[ReservaForm] handleSubmit triggered. isEditMode:',
      isEditMode
    );
    setError(null);

    // Validaciones
    if (!isEditMode && !examen?.value)
      return setError('Debe seleccionar un examen.');
    if (!sala?.value) return setError('Debe seleccionar una sala.');
    if (modulosIds.length === 0)
      return setError('Debe seleccionar al menos un módulo.');
    // Docente es requerido si no estamos en modo edición, O si estamos en modo edición y el campo docente está vacío (asumiendo que siempre debe haber uno)
    // Si en modo edición el docente puede ser opcional o manejado de otra forma, ajustar esta lógica.
    // Por ahora, si el campo docente es editable, asumimos que si hay un valor, se debe enviar.
    // La validación de si es *obligatorio* en edición podría ser más compleja.
    if (!fechaReserva)
      return setError('Debe seleccionar una fecha de reserva.');

    // CORREGIR: Usar los nombres que espera el backend
    const payload = {
      fecha_reserva: fechaReserva,
      sala_id_sala: sala.value,
      modulos_ids: modulosIds,
    };

    if (!isEditMode) {
      payload.examen_id_examen = examen.value;
      if (!docente?.value)
        return setError('Debe seleccionar un docente para crear una reserva.');
      payload.docente_ids = [docente.value];
    } else {
      // En modo edición, si el docente es editable y se ha seleccionado uno, lo incluimos.
      // El backend espera 'docente_ids' como un array.
      if (docente?.value) {
        payload.docente_ids = [docente.value];
      }
      // Si en modo edición el docente no se puede cambiar o no se quiere enviar, se omite.
    }
    console.log('[ReservaForm] Payload a enviar a onSubmit:', payload);
    onSubmit(payload);
  };

  if (loadingData && !initialData) {
    // Mostrar spinner solo si no hay initialData (evita parpadeo en edición)
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <p className="mt-2">Cargando datos...</p>
      </div>
    );
  }

  // --- Renderizado de datos originales en modo edición ---
  const renderOriginalReservationDetails = () => {
    if (!isEditMode || !initialData) {
      return null;
    }
    return (
      <div className="mb-3 p-3 border rounded bg-light-subtle shadow-sm">
        <h6 className="mb-2 text-primary">
          Detalles Originales de la Reserva a Editar:
        </h6>
        {initialData.fechaReservaOriginal && (
          <p className="mb-1 small">
            <strong>Fecha Original:</strong> {initialData.fechaReservaOriginal}
          </p>
        )}
        {initialData.salaOriginalNombre && (
          <p className="mb-1 small">
            <strong>Sala Original:</strong> {initialData.salaOriginalNombre}
          </p>
        )}
        {initialData.docenteOriginalNombre && (
          <p className="mb-1 small">
            <strong>Docente Original:</strong>
            {initialData.docenteOriginalNombre}
          </p>
        )}
        {initialData.modulosOriginalesNombres &&
          initialData.modulosOriginalesNombres.length > 0 && (
            <p className="mb-1 small">
              <strong>Módulos Originales:</strong>
              {initialData.modulosOriginalesNombres.join(', ')}
            </p>
          )}
        <div className="mt-2 pt-2 border-top">
          <p className="mb-1 small">
            <strong>Observaciones del Docente (Originales):</strong>
          </p>
          <p
            className="mb-0 small fst-italic bg-white p-2 rounded border"
            style={{ whiteSpace: 'pre-wrap' }} // Para respetar saltos de línea
          >
            {initialData.observacionesDocenteOriginal ||
              'No se registraron observaciones'}
          </p>
        </div>
      </div>
    );
  };
  return (
    <>
      {renderOriginalReservationDetails()}
      <Form onSubmit={handleSubmit} noValidate>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        <Form.Group as={Col} md="12" className="mb-3">
          <Form.Label>Examen</Form.Label>
          <InputGroup className="d-flex flex-nowrap">
            <Select
              styles={customSelectStyles}
              className="flex-grow-1"
              value={examen}
              onChange={setExamen}
              options={examenesOptions}
              placeholder="Seleccione o busque un examen..."
              isDisabled={isEditMode || isLoadingExternally}
              isClearable={!isEditMode} // Solo se puede limpiar en modo creación
            />
            {!isEditMode && (
              <Button
                variant="outline-secondary"
                onClick={() => setExamenFilterOpen(true)}
                disabled={isLoadingExternally}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-filter"
                  viewBox="0 0 16 16"
                >
                  <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
                </svg>
              </Button>
            )}
          </InputGroup>
        </Form.Group>

        <Row className="mb-3">
          <Form.Group as={Col} md={6}>
            <Form.Label>Fecha de Reserva</Form.Label>
            <Form.Control
              type="date"
              value={fechaReserva}
              onChange={(e) => setFechaReserva(e.target.value)}
              required
              disabled={isLoadingExternally}
            />
          </Form.Group>
          <Form.Group as={Col} md={6}>
            <Form.Label>Sala</Form.Label>
            <InputGroup className="d-flex flex-nowrap">
              {/* flex-nowrap para evitar que el botón salte abajo */}
              <Select
                styles={customSelectStyles}
                className="flex-grow-1"
                value={sala}
                onChange={setSala}
                options={salasOptions}
                placeholder="Seleccione una sala..."
                isDisabled={isLoadingExternally}
                isClearable // La sala siempre se puede limpiar para cambiarla
              />
              <Button
                variant="outline-secondary"
                onClick={() => setSalaFilterOpen(true)}
                disabled={isLoadingExternally}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-filter"
                  viewBox="0 0 16 16"
                >
                  <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
                </svg>
              </Button>
            </InputGroup>
          </Form.Group>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Docente Asignado</Form.Label>
          <AsyncSelect
            styles={customSelectStyles}
            cacheOptions
            defaultOptions={defaultDocenteOptions}
            value={docente}
            onChange={setDocente}
            loadOptions={loadDocenteOptions}
            placeholder="Buscar docente por nombre..."
            noOptionsMessage={() => 'No se encontraron docentes'}
            formatOptionLabel={formatDocenteOptionLabel}
            isDisabled={isLoadingExternally} // Permitir edición de docente
            isClearable // Permitir limpiar el docente seleccionado
          />
        </Form.Group>

        {isEditMode && initialData?.salaOriginalNombre && (
          <Form.Text className="text-muted d-block mb-1">
            Sala Original: {initialData.salaOriginalNombre}
          </Form.Text>
        )}
        {isEditMode &&
          initialData?.modulosOriginalesNombres &&
          initialData.modulosOriginalesNombres.length > 0 && (
            <Form.Text className="text-muted d-block mb-3">
              Módulos Originales:
              {initialData.modulosOriginalesNombres.join(', ')}
            </Form.Text>
          )}

        <Form.Group className="mb-3">
          <Form.Label>Módulos Disponibles</Form.Label>
          <div
            className="p-3 border rounded"
            style={{
              minHeight: '100px',
              maxHeight: '150px',
              overflowY: 'auto',
            }}
          >
            {loadingModules ? (
              <div className="text-center">
                <Spinner animation="border" size="sm" />
                <p className="text-muted mt-1">Buscando módulos...</p>
              </div>
            ) : !fechaReserva || !sala?.value ? (
              <p className="text-muted">
                Seleccione una fecha y una sala para ver los módulos
                disponibles.
              </p>
            ) : modulos.length > 0 ? (
              modulos.map((m) => (
                <Form.Check
                  key={m.ID_MODULO}
                  type="checkbox"
                  id={`modulo-${m.ID_MODULO}`}
                  label={`${m.NOMBRE_MODULO} (${m.INICIO_MODULO} - ${m.FIN_MODULO})`}
                  value={m.ID_MODULO}
                  checked={modulosIds.includes(m.ID_MODULO)}
                  onChange={handleModuloChange}
                  disabled={isLoadingExternally || isModuleDisabled(m)}
                />
              ))
            ) : (
              <p className="text-muted">
                No hay módulos disponibles para esta fecha y sala, o ya están
                todos reservados.
              </p>
            )}
          </div>
          <Form.Text className="text-muted">
            Solo puedes seleccionar módulos consecutivos.
          </Form.Text>
        </Form.Group>

        <div className="d-flex justify-content-end mt-4">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoadingExternally}
            className="me-2"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isLoadingExternally || (loadingData && !isEditMode)} // Deshabilitar si está cargando datos en modo creación
          >
            {isLoadingExternally ? (
              <>
                <Spinner size="sm" /> Guardando...
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </div>
      </Form>

      <FilterModalSalas
        isOpen={isSalaFilterOpen}
        onClose={() => setSalaFilterOpen(false)}
        sedesDisponibles={sedes} // Deberían ser todas las sedes para el filtro de salas
        selectedSede={salaFilters.selectedSede}
        onSetSelectedSede={(value) =>
          setSalaFilters((f) => ({
            ...f,
            selectedSede: value,
            selectedEdificio: '', // Resetear edificio al cambiar sede
          }))
        }
        edificiosDisponibles={edificios} // Todos los edificios
        selectedEdificio={salaFilters.selectedEdificio}
        onSetSelectedEdificio={(value) =>
          setSalaFilters((f) => ({ ...f, selectedEdificio: value }))
        }
        onAplicarFiltros={handleApplySalaFilters}
      />
      <FilterModalExamenes
        isOpen={isExamenFilterOpen}
        onClose={() => setExamenFilterOpen(false)}
        onAplicarFiltros={handleApplyExamenFilters}
        onLimpiarFiltros={handleLimpiarExamenFilters}
        // Estas listas deben ser filtradas según los exámenes del usuario
        sedes={sedes}
        escuelas={escuelas}
        carreras={carreras}
        asignaturas={asignaturas}
        // El modal de filtro de exámenes no maneja 'estados' actualmente
        // estados={estados}
        selectedSede={examenFilters.selectedSede}
        onSetSelectedSede={handleExamenSedeChange}
        selectedEscuela={examenFilters.selectedEscuela}
        onSetSelectedEscuela={handleExamenEscuelaChange}
        selectedCarrera={examenFilters.selectedCarrera}
        onSetSelectedCarrera={handleExamenCarreraChange}
        selectedAsignatura={examenFilters.selectedAsignatura}
        onSetSelectedAsignatura={handleExamenAsignaturaChange}
        selectedEstado={examenFilters.selectedEstado}
        onSetSelectedEstado={handleExamenEstadoChange}
      />
    </>
  );
};

export default ReservaForm;
