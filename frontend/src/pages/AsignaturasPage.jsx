import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Añadir useCallback y useMemo
import Layout from '../components/Layout';
import EscuelaForm from '../components/escuelas/EscuelaForm';
import EscuelaList from '../components/escuelas/EscuelaList';
import EscuelaActions from '../components/escuelas/EscuelaActions';
import CarreraForm from '../components/carreras/CarreraForm';
import CarreraList from '../components/carreras/CarreraList';
import CarreraActions from '../components/carreras/CarreraActions';
import AsignaturaForm from '../components/asignaturas/AsignaturaForm';
import AsignaturaList from '../components/asignaturas/AsignaturaList';
import AsignaturaActions from '../components/asignaturas/AsignaturaActions';
import SeccionForm from '../components/secciones/SeccionForm';
import SeccionList from '../components/secciones/SeccionList';
import SeccionActions from '../components/secciones/SeccionActions';

// Importar los nuevos filtros
import EscuelaFilter from '../components/escuelas/EscuelaFilter';
import CarreraFilter from '../components/carreras/CarreraFilter';
import AsignaturaFilter from '../components/asignaturas/AsignaturaFilter';
import SeccionFilter from '../components/secciones/SeccionFilter';

import {
  fetchAllAsignaturas as fetchAllAsignaturasService, // Renombrar para evitar conflicto
  createAsignatura as AddAsignatura,
  updateAsignatura as EditAsignatura,
  deleteAsignatura as DeleteAsignatura,
} from '../services/asignaturaService';
import {
  fetchAllSecciones as fetchAllSeccionesService, // Renombrar
  createSeccion as AddSeccion, // Asumiendo que seccionService exporta createSeccion
  updateSeccion as EditSeccion, // Asumiendo que seccionService exporta updateSeccion
  deleteSeccion as DeleteSeccion, // Asumiendo que seccionService exporta deleteSeccion
} from '../services/seccionService';
import {
  createCarrera as AddCarrera, // Asumiendo que carreraService exporta createCarrera
  updateCarrera as EditCarrera, // Asumiendo que carreraService exporta updateCarrera
  deleteCarrera as DeleteCarrera, // Asumiendo que carreraService exporta deleteCarrera
  fetchAllCarreras as fetchAllCarrerasService, // Renombrar
} from '../services/carreraService';
import {
  createEscuela as AddEscuela,
  updateEscuela as EditEscuela,
  deleteEscuela as DeleteEscuela,
  fetchAllEscuelas as fetchAllEscuelasService, // Renombrar
} from '../services/escuelaService';
import PaginationComponent from '../components/PaginationComponent'; // Importar PaginationComponent

// Importar Alert y Spinner de react-bootstrap
import { Alert, Spinner } from 'react-bootstrap';

const alertStyle = {
  animation: 'fadeInOut 5s ease-in-out',
  WebkitAnimation: 'fadeInOut 5s ease-in-out',
  opacity: 1,
};

function Modal({ title, children, onClose }) {
  return (
    <div
      className="modal show"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function AsignaturasPage() {
  const [secciones, setSecciones] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [selectedAsignaturas, setSelectedAsignaturas] = useState([]);
  const [selectedCarreras, setSelectedCarreras] = useState([]);
  // const [selectedEscuela, setSelectedEscuela] = useState(null); // REEMPLAZADO
  const [selectedEscuelas, setSelectedEscuelas] = useState([]); // NUEVO ESTADO
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ type: null, entity: null, data: null });
  const [activeTab, setActiveTab] = useState('secciones'); // Cambiado a 'secciones' para que sea la primera
  const [selectedSecciones, setSelectedSecciones] = useState([]);

  // Estados para los filtros
  const [escuelaFilters, setEscuelaFilters] = useState({ nombre: '' });
  const [carreraFilters, setCarreraFilters] = useState({
    nombre: '',
    escuela: '',
  });
  const [asignaturaFilters, setAsignaturaFilters] = useState({
    nombre: '',
    escuela: '',
    carrera: '',
  });
  const [seccionFilters, setSeccionFilters] = useState({
    nombre: '',
    escuela: '',
    carrera: '',
    asignatura: '',
  });

  // Estados para datos "enriquecidos" (con IDs de jerarquía superior)
  // Esto es opcional pero puede simplificar la lógica de filtrado de listas principales
  // Por ahora, filtraremos directamente, pero considera enriquecer si la lógica se vuelve muy compleja.
  // const [processedAsignaturas, setProcessedAsignaturas] = useState([]);
  // const [processedSecciones, setProcessedSecciones] = useState([]);

  const displayMessage = (setter, message, duration = 4000) => {
    setter(message);
    setTimeout(() => {
      setter('');
    }, duration);
  };

  // Estados para paginación
  const [itemsPerPage, setItemsPerPage] = useState(6); // Cambiado a 6
  const [currentPageAsignaturas, setCurrentPageAsignaturas] = useState(1);
  const [currentPageSecciones, setCurrentPageSecciones] = useState(1);
  const [currentPageCarreras, setCurrentPageCarreras] = useState(1);
  const [currentPageEscuelas, setCurrentPageEscuelas] = useState(1);

  useEffect(() => {
    loadData();
  }, []); // Cargar datos solo una vez al montar

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [asignaturasRes, carrerasRes, escuelasRes, seccionesRes] =
        await Promise.all([
          fetchAllAsignaturasService(),
          fetchAllCarrerasService(),
          fetchAllEscuelasService(),
          fetchAllSeccionesService(),
        ]);

      // Los servicios ya devuelven response.data
      setSecciones(seccionesRes || []);
      setAsignaturas(asignaturasRes || []);
      setCarreras(carrerasRes || []);
      setEscuelas(escuelasRes || []);

      setCurrentPageAsignaturas(1);
      setCurrentPageSecciones(1);
      setCurrentPageCarreras(1);
      setCurrentPageEscuelas(1);
      setError('');
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      setError(
        'Error al cargar los datos. Por favor, inténtalo de nuevo más tarde.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const closeModal = () => setModal({ type: null, entity: null, data: null });

  const openModal = (type, entity) => {
    let data = null;
    if (type === 'edit') {
      switch (entity) {
        case 'asignatura':
          if (selectedAsignaturas.length !== 1) {
            setError('Por favor, seleccione una única asignatura para editar.');
            setTimeout(() => setError(''), 5000);
            return;
          }
          data = selectedAsignaturas[0];
          break;
        case 'seccion':
          if (selectedSecciones.length !== 1) {
            setError('Por favor, seleccione una única sección para editar.');
            setTimeout(() => setError(''), 5000);
            return;
          }
          data = selectedSecciones[0];
          // console.log(
          //   'Datos de la SECCIÓN seleccionada para editar (en AsignaturasPage):',
          //   data
          // );
          break;
        case 'carrera':
          if (selectedCarreras.length !== 1) {
            setError('Por favor, seleccione una única carrera para editar.');
            setTimeout(() => setError(''), 5000);
            return;
          }
          data = selectedCarreras[0];
          break;
        case 'escuela':
          if (selectedEscuelas.length !== 1) {
            setError('Por favor, seleccione una única escuela para editar.');
            setTimeout(() => setError(''), 5000);
            return;
          }
          data = selectedEscuelas[0];
          break;
        default:
          break;
      }
    } else if (type === 'delete') {
      switch (entity) {
        case 'asignatura':
          if (selectedAsignaturas.length === 0) {
            setError(
              'Por favor, seleccione al menos una asignatura para eliminar.'
            );
            setTimeout(() => setError(''), 5000);
            return;
          }
          break;
        case 'seccion':
          if (selectedSecciones.length === 0) {
            setError(
              'Por favor, seleccione al menos una sección para eliminar.'
            );
            setTimeout(() => setError(''), 5000);
            return;
          }
          break;
        case 'carrera':
          if (selectedCarreras.length === 0) {
            setError(
              'Por favor, seleccione al menos una carrera para eliminar.'
            );
            setTimeout(() => setError(''), 5000);
            return;
          }
          break;
        case 'escuela':
          if (selectedEscuelas.length === 0) {
            setError(
              'Por favor, seleccione al menos una escuela para eliminar.'
            );
            setTimeout(() => setError(''), 5000);
            return;
          }
          break;
        default:
          break;
      }
    }
    setModal({ type, entity, data });
  };

  // --- Handlers para cambios de Filtros ---
  const handleEscuelaFilterChange = useCallback((changedFilters) => {
    setEscuelaFilters((prev) => ({ ...prev, ...changedFilters }));
    setCurrentPageEscuelas(1);
  }, []);

  const handleCarreraFilterChange = useCallback((changedFilters) => {
    setCarreraFilters((prev) => ({ ...prev, ...changedFilters }));
    setCurrentPageCarreras(1);
  }, []);

  const handleAsignaturaFilterChange = useCallback((changedFilters) => {
    setAsignaturaFilters((prev) => {
      const newFilters = { ...prev, ...changedFilters };
      if (changedFilters.escuela !== undefined) {
        // Si cambia escuela, resetear carrera
        newFilters.carrera = '';
      }
      return newFilters;
    });
    setCurrentPageAsignaturas(1);
  }, []);

  const handleSeccionFilterChange = useCallback((changedFilters) => {
    setSeccionFilters((prev) => {
      const newFilters = { ...prev, ...changedFilters };
      if (changedFilters.escuela !== undefined) {
        // Si cambia escuela, resetear carrera y asignatura
        newFilters.carrera = '';
        newFilters.asignatura = '';
      } else if (changedFilters.carrera !== undefined) {
        // Si cambia carrera, resetear asignatura
        newFilters.asignatura = '';
      }
      return newFilters;
    });
    setCurrentPageSecciones(1);
  }, []);

  // --- Opciones para Dropdowns de Filtros Dependientes ---
  const carrerasOptionsForAsignaturaFilter = useMemo(() => {
    if (!asignaturaFilters.escuela) return carreras; // Mostrar todas si no hay escuela seleccionada
    return carreras.filter(
      (c) => String(c.ESCUELA_ID_ESCUELA) === String(asignaturaFilters.escuela)
    );
  }, [asignaturaFilters.escuela, carreras]);

  const carrerasOptionsForSeccionFilter = useMemo(() => {
    if (!seccionFilters.escuela) return carreras;
    return carreras.filter(
      (c) => String(c.ESCUELA_ID_ESCUELA) === String(seccionFilters.escuela)
    );
  }, [seccionFilters.escuela, carreras]);

  const asignaturasOptionsForSeccionFilter = useMemo(() => {
    if (!seccionFilters.carrera) return asignaturas;
    return asignaturas.filter(
      (a) => String(a.CARRERA_ID_CARRERA) === String(seccionFilters.carrera)
    );
  }, [seccionFilters.carrera, asignaturas]);

  // --- Listas Filtradas ---
  const filteredEscuelas = useMemo(() => {
    return escuelas.filter(
      (e) =>
        !escuelaFilters.nombre ||
        e.NOMBRE_ESCUELA.toLowerCase().includes(
          escuelaFilters.nombre.toLowerCase()
        )
    );
  }, [escuelas, escuelaFilters]);

  const filteredCarreras = useMemo(() => {
    return carreras.filter(
      (c) =>
        (!carreraFilters.nombre ||
          c.NOMBRE_CARRERA.toLowerCase().includes(
            carreraFilters.nombre.toLowerCase()
          )) &&
        (!carreraFilters.escuela ||
          String(c.ESCUELA_ID_ESCUELA) === String(carreraFilters.escuela))
    );
  }, [carreras, carreraFilters]);

  const filteredAsignaturas = useMemo(() => {
    // Para filtrar asignatura por escuela, necesitamos el ID de escuela de la carrera de la asignatura
    return asignaturas.filter((a) => {
      const matchesNombre =
        !asignaturaFilters.nombre ||
        a.NOMBRE_ASIGNATURA.toLowerCase().includes(
          asignaturaFilters.nombre.toLowerCase()
        );
      const matchesCarrera =
        !asignaturaFilters.carrera ||
        String(a.CARRERA_ID_CARRERA) === String(asignaturaFilters.carrera);

      let matchesEscuela = true;
      if (asignaturaFilters.escuela) {
        const carreraDeAsignatura = carreras.find(
          (c) => String(c.ID_CARRERA) === String(a.CARRERA_ID_CARRERA)
        );
        matchesEscuela = carreraDeAsignatura
          ? String(carreraDeAsignatura.ESCUELA_ID_ESCUELA) ===
            String(asignaturaFilters.escuela)
          : false;
      }
      return matchesNombre && matchesCarrera && matchesEscuela;
    });
  }, [asignaturas, asignaturaFilters, carreras]);

  const filteredSecciones = useMemo(() => {
    return secciones.filter((s) => {
      const matchesNombre =
        !seccionFilters.nombre ||
        s.NOMBRE_SECCION.toLowerCase().includes(
          seccionFilters.nombre.toLowerCase()
        ) ||
        (s.CODIGO_SECCION &&
          s.CODIGO_SECCION.toLowerCase().includes(
            seccionFilters.nombre.toLowerCase()
          ));
      const matchesAsignatura =
        !seccionFilters.asignatura ||
        String(s.ASIGNATURA_ID_ASIGNATURA) ===
          String(seccionFilters.asignatura);

      let matchesCarrera = true;
      let matchesEscuela = true;

      if (seccionFilters.carrera || seccionFilters.escuela) {
        const asignaturaDeSeccion = asignaturas.find(
          (asig) =>
            String(asig.ID_ASIGNATURA) === String(s.ASIGNATURA_ID_ASIGNATURA)
        );
        if (asignaturaDeSeccion) {
          if (seccionFilters.carrera)
            matchesCarrera =
              String(asignaturaDeSeccion.CARRERA_ID_CARRERA) ===
              String(seccionFilters.carrera);
          if (seccionFilters.escuela && matchesCarrera) {
            // Solo chequear escuela si la carrera (o el filtro de carrera) coincide
            const carreraDeAsignatura = carreras.find(
              (c) =>
                String(c.ID_CARRERA) ===
                String(asignaturaDeSeccion.CARRERA_ID_CARRERA)
            );
            matchesEscuela = carreraDeAsignatura
              ? String(carreraDeAsignatura.ESCUELA_ID_ESCUELA) ===
                String(seccionFilters.escuela)
              : false;
          }
        } else {
          // Si no se encuentra la asignatura, no puede coincidir con filtros de carrera o escuela
          if (seccionFilters.carrera || seccionFilters.escuela) return false;
        }
      }
      return (
        matchesNombre && matchesAsignatura && matchesCarrera && matchesEscuela
      );
    });
  }, [secciones, seccionFilters, asignaturas, carreras]);

  // --- Funciones CRUD para Escuela ---
  const handleAddEscuela = async (form) => {
    try {
      await AddEscuela(form);
      loadData();
      closeModal();
      setSuccess('Escuela agregada con éxito');
      displayMessage(setSuccess, 'Escuela agregada con éxito');
    } catch (error) {
      setError('Error al agregar escuela');
      console.error('Error:', error);
      setTimeout(() => setError(''), 5000);
      closeModal();
    }
  };

  const handleEditEscuela = async (form) => {
    try {
      if (selectedEscuelas.length !== 1) {
        setError(
          'Error: Debe haber exactamente una escuela seleccionada para editar.'
        );
        setTimeout(() => setError(''), 5000);
        return;
      }
      await EditEscuela(selectedEscuelas[0].ID_ESCUELA, form);
      loadData();
      closeModal();
      setSuccess('Escuela actualizada con éxito');
      setSelectedEscuelas([]);
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Error al actualizar escuela');
      console.error('Error:', error);
      setTimeout(() => setError(''), 5000);
      closeModal();
    }
  };

  const handleDeleteEscuela = async () => {
    if (selectedEscuelas.length === 0) {
      setError('No hay escuelas seleccionadas para eliminar.');
      setTimeout(() => setError(''), 5000);
      closeModal();
      return;
    }
    try {
      for (const escuela of selectedEscuelas) {
        await DeleteEscuela(escuela.ID_ESCUELA);
      }
      loadData();
      closeModal();
      setSuccess(
        `${selectedEscuelas.length} escuela(s) eliminada(s) con éxito`
      );
      setSelectedEscuelas([]);
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Error al eliminar escuela(s)');
      console.error('Error:', error);
      setTimeout(() => setError(''), 5000);
      closeModal();
    }
  };

  // --- Funciones de selección para Escuela ---
  const handleToggleEscuelaSelection = (escuelaToToggle) => {
    setSelectedEscuelas((prevSelected) => {
      const isSelected = prevSelected.find(
        (e) => e.ID_ESCUELA === escuelaToToggle.ID_ESCUELA
      );
      if (isSelected) {
        return prevSelected.filter(
          (e) => e.ID_ESCUELA !== escuelaToToggle.ID_ESCUELA
        );
      }
      return [...prevSelected, escuelaToToggle];
    });
  };

  const handleToggleSelectAllEscuelas = () => {
    // currentEscuelas son las visibles en la paginación actual
    if (selectedEscuelas.length === paginatedEscuelas.length) {
      // Usar paginatedEscuelas
      setSelectedEscuelas([]);
    } else {
      setSelectedEscuelas([...paginatedEscuelas]); // Usar paginatedEscuelas
    }
  };

  // --- Funciones CRUD y de selección para Asignatura (ya implementadas) ---
  const handleToggleAsignaturaSelection = (asignaturaToToggle) => {
    setSelectedAsignaturas((prevSelected) => {
      const isSelected = prevSelected.find(
        (a) => a.ID_ASIGNATURA === asignaturaToToggle.ID_ASIGNATURA
      );
      if (isSelected) {
        return prevSelected.filter(
          (a) => a.ID_ASIGNATURA !== asignaturaToToggle.ID_ASIGNATURA
        );
      }
      return [...prevSelected, asignaturaToToggle];
    });
  };

  const handleToggleSelectAllAsignaturas = () => {
    // currentAsignaturas son las visibles en la paginación actual
    if (selectedAsignaturas.length === paginatedAsignaturas.length) {
      // Usar paginatedAsignaturas
      setSelectedAsignaturas([]);
    } else {
      setSelectedAsignaturas([...paginatedAsignaturas]); // Usar paginatedAsignaturas
    }
  };

  // --- Funciones CRUD para Asignatura ---
  const handleAddAsignatura = async (form) => {
    try {
      await AddAsignatura(form); // AddAsignatura es createAsignatura del servicio
      loadData();
      closeModal();
      displayMessage(setSuccess, 'Asignatura agregada con éxito');
    } catch (error) {
      setError(
        'Error al agregar asignatura: ' +
          (error.response?.data?.error || error.message)
      );
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleEditAsignatura = async (form) => {
    try {
      if (selectedAsignaturas.length !== 1) {
        setError(
          'Error: Debe haber exactamente una asignatura seleccionada para editar.'
        );
        setTimeout(() => setError(''), 5000);
        return;
      }
      await EditAsignatura(selectedAsignaturas[0].ID_ASIGNATURA, form); // EditAsignatura es updateAsignatura del servicio
      loadData();
      closeModal();
      displayMessage(setSuccess, 'Asignatura actualizada con éxito');
      setSelectedAsignaturas([]); // Limpiar selección
    } catch (error) {
      setError(
        'Error al actualizar asignatura: ' +
          (error.response?.data?.error || error.message)
      );
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleDeleteAsignatura = async () => {
    if (selectedAsignaturas.length === 0) {
      setError('No hay asignaturas seleccionadas para eliminar.');
      setTimeout(() => setError(''), 5000);
      closeModal();
      return;
    }
    try {
      for (const asignatura of selectedAsignaturas) {
        await DeleteAsignatura(asignatura.ID_ASIGNATURA); // DeleteAsignatura es deleteAsignatura del servicio
      }
      loadData();
      closeModal();
      displayMessage(
        setSuccess,
        `${selectedAsignaturas.length} asignatura(s) eliminada(s) con éxito`
      );
      setSelectedAsignaturas([]); // Limpiar selección
    } catch (error) {
      setError(
        'Error al eliminar asignatura(s): ' +
          (error.response?.data?.error || error.message)
      );
      console.error('Error:', error);
      closeModal();
    }
  };

  // --- Funciones CRUD y de selección para Seccion (ya implementadas) ---
  const handleToggleSeccionSelection = (seccionToToggle) => {
    setSelectedSecciones((prevSelected) => {
      const isSelected = prevSelected.find(
        (s) => s.ID_SECCION === seccionToToggle.ID_SECCION
      );
      if (isSelected) {
        return prevSelected.filter(
          (s) => s.ID_SECCION !== seccionToToggle.ID_SECCION
        );
      }
      return [...prevSelected, seccionToToggle];
    });
  };

  const handleToggleSelectAllSecciones = () => {
    if (selectedSecciones.length === paginatedSecciones.length) {
      // Usar paginatedSecciones
      setSelectedSecciones([]);
    } else {
      setSelectedSecciones([...paginatedSecciones]); // Usar paginatedSecciones
    }
  };

  const handleAddSeccion = async (form) => {
    try {
      await AddSeccion(form);
      loadData();
      closeModal();
      setSuccess('Sección creada con éxito');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      setError('Error al crear seccion');
      setTimeout(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  const handleEditSeccion = async (form) => {
    try {
      if (selectedSecciones.length !== 1) {
        setError(
          'Error: Debe haber exactamente una sección seleccionada para editar.'
        );
        setTimeout(() => setError(''), 5000);
        return;
      }
      await EditSeccion(selectedSecciones[0].ID_SECCION, form); // Usar el ID de la sección seleccionada
      loadData();
      closeModal();
      setSuccess('Sección actualizada con éxito');
      setSelectedSecciones([]); // Limpiar selección
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      setError('Error al actualizar seccion');
      setTimeout(() => {
        setError('');
      }, 5000);
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleDeleteSeccion = async () => {
    if (selectedSecciones.length === 0) {
      setError('No hay secciones seleccionadas para eliminar.');
      setTimeout(() => setError(''), 5000);
      closeModal();
      return;
    }

    try {
      // Asumimos que DeleteSeccion puede tomar un ID.
      // Si tu backend soporta borrado masivo, puedes enviar todos los IDs.
      // Por ahora, lo haremos uno por uno.
      for (const seccion of selectedSecciones) {
        await DeleteSeccion(seccion.ID_SECCION);
      }
      loadData();
      closeModal();
      setSuccess(
        `${selectedSecciones.length} sección(es) eliminada(s) con éxito`
      );
      setSelectedSecciones([]); // Limpiar selección
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      setError('Error al eliminar sección(es)');
      console.error('Error:', error);
      setTimeout(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  // --- Funciones CRUD y de selección para Carrera (ya implementadas) ---
  const handleToggleCarreraSelection = (carreraToToggle) => {
    setSelectedCarreras((prevSelected) => {
      const isSelected = prevSelected.find(
        (c) => c.ID_CARRERA === carreraToToggle.ID_CARRERA
      );
      if (isSelected) {
        return prevSelected.filter(
          (c) => c.ID_CARRERA !== carreraToToggle.ID_CARRERA
        );
      }
      return [...prevSelected, carreraToToggle];
    });
  };

  const handleToggleSelectAllCarreras = () => {
    // currentCarreras son las visibles en la paginación actual
    if (selectedCarreras.length === paginatedCarreras.length) {
      // Usar paginatedCarreras
      setSelectedCarreras([]);
    } else {
      setSelectedCarreras([...paginatedCarreras]); // Usar paginatedCarreras
    }
  };

  const handleAddCarrera = async (form) => {
    try {
      await AddCarrera(form);
      loadData();
      closeModal();
      setSuccess('Carrera agregada con éxito');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Error al agregar carrera');
      console.error('Error:', error);
      setTimeout(() => setError(''), 5000);
      closeModal();
    }
  };

  const handleEditCarrera = async (form) => {
    try {
      if (selectedCarreras.length !== 1) {
        setError(
          'Error: Debe haber exactamente una carrera seleccionada para editar.'
        );
        setTimeout(() => setError(''), 5000);
        return;
      }
      await EditCarrera(selectedCarreras[0].ID_CARRERA, form);
      loadData();
      closeModal();
      setSuccess('Carrera actualizada con éxito');
      setSelectedCarreras([]); // Limpiar selección
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Error al actualizar carrera');
      console.error('Error:', error);
      setTimeout(() => setError(''), 5000);
      closeModal();
    }
  };

  const handleDeleteCarrera = async () => {
    if (selectedCarreras.length === 0) {
      setError('No hay carreras seleccionadas para eliminar.');
      setTimeout(() => setError(''), 5000);
      closeModal();
      return;
    }
    try {
      for (const carrera of selectedCarreras) {
        await DeleteCarrera(carrera.ID_CARRERA);
      }
      loadData();
      closeModal();
      setSuccess(
        `${selectedCarreras.length} carrera(s) eliminada(s) con éxito`
      );
      setSelectedCarreras([]); // Limpiar selección
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Error al eliminar carrera(s)');
      console.error('Error:', error);
      setTimeout(() => setError(''), 5000);
      closeModal();
    }
  };

  // Funciones de paginación
  const paginateAsignaturas = (pageNumber) =>
    setCurrentPageAsignaturas(pageNumber);
  const paginateSecciones = (pageNumber) => setCurrentPageSecciones(pageNumber);
  const paginateCarreras = (pageNumber) => setCurrentPageCarreras(pageNumber);
  const paginateEscuelas = (pageNumber) => setCurrentPageEscuelas(pageNumber);

  // Calcular datos para la página actual
  const getPaginatedData = (items, currentPage) => {
    if (!Array.isArray(items)) return [];
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  };

  const indexOfLastAsignatura = currentPageAsignaturas * itemsPerPage;
  const indexOfFirstAsignatura = indexOfLastAsignatura - itemsPerPage;
  const paginatedAsignaturas = getPaginatedData(
    filteredAsignaturas,
    currentPageAsignaturas
  );

  const indexOfLastSeccion = currentPageSecciones * itemsPerPage;
  const indexOfFirstSeccion = indexOfLastSeccion - itemsPerPage;
  const paginatedSecciones = getPaginatedData(
    filteredSecciones,
    currentPageSecciones
  );

  const indexOfLastCarrera = currentPageCarreras * itemsPerPage;
  const indexOfFirstCarrera = indexOfLastCarrera - itemsPerPage;
  const paginatedCarreras = getPaginatedData(
    filteredCarreras,
    currentPageCarreras
  );

  const indexOfLastEscuela = currentPageEscuelas * itemsPerPage;
  const indexOfFirstEscuela = indexOfLastEscuela - itemsPerPage;
  const paginatedEscuelas = getPaginatedData(
    filteredEscuelas,
    currentPageEscuelas
  );

  if (
    loading &&
    !escuelas.length &&
    !carreras.length &&
    !asignaturas.length &&
    !secciones.length
  ) {
    return (
      <Layout>
        <div className="container text-center mt-5">
          <Spinner animation="border" variant="primary" />
          <p>Cargando datos iniciales...</p>
        </div>
      </Layout>
    );
  }

  const handleSetTab = (tabName) => {
    setActiveTab(tabName);
    // Opcional: resetear selecciones al cambiar de pestaña
    setSelectedAsignaturas([]);
    setSelectedSecciones([]);
    setSelectedCarreras([]);
    setSelectedEscuelas([]);
  };

  return (
    <Layout>
      <div className="container-fluid pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="display-6">
            <i className="bi bi-book-fill me-3"></i>
            Gestión Administrativa
          </h2>
        </div>
        <hr />

        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess('')} dismissible>
            {success}
          </Alert>
        )}
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'secciones' ? 'active' : ''}`}
              onClick={() => handleSetTab('secciones')}
            >
              Secciones
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'asignaturas' ? 'active' : ''}`}
              onClick={() => handleSetTab('asignaturas')}
            >
              Asignaturas
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'carreras' ? 'active' : ''}`}
              onClick={() => handleSetTab('carreras')}
            >
              Carreras
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'escuelas' ? 'active' : ''}`}
              onClick={() => handleSetTab('escuelas')}
            >
              Escuelas
            </button>
          </li>
        </ul>
        {activeTab === 'secciones' && (
          <>
            <SeccionFilter
              escuelas={escuelas}
              carrerasOptions={carrerasOptionsForSeccionFilter}
              asignaturasOptions={asignaturasOptionsForSeccionFilter}
              onFilterChange={handleSeccionFilterChange}
              currentFilters={seccionFilters}
            />
            <SeccionActions
              onAdd={() => openModal('add', 'seccion')}
              onEdit={() => openModal('edit', 'seccion')}
              onDelete={() => openModal('delete', 'seccion')}
              selectedSecciones={selectedSecciones}
            />
            {loading && paginatedSecciones.length === 0 ? (
              <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <p>Cargando secciones...</p>
              </div>
            ) : (
              <SeccionList
                secciones={paginatedSecciones}
                selectedSecciones={selectedSecciones}
                onToggleSeccionSelection={handleToggleSeccionSelection}
                onToggleSelectAll={handleToggleSelectAllSecciones}
                // loading={loading} // El loading general se maneja arriba
              />
            )}
            {!loading && filteredSecciones.length > itemsPerPage && (
              <div className="mt-3">
                {/* Añadido margen superior */}
                <PaginationComponent
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredSecciones.length}
                  paginate={paginateSecciones}
                  currentPage={currentPageSecciones}
                />
              </div>
            )}
          </>
        )}
        {modal.type && modal.entity === 'seccion' && (
          <Modal
            title={
              modal.type === 'add'
                ? 'Agregar Sección'
                : modal.type === 'edit'
                  ? 'Editar Sección'
                  : `Eliminar Sección(es) (${selectedSecciones.length})`
            }
            onClose={closeModal}
          >
            {modal.type === 'delete' ? (
              <div>
                <p>
                  ¿Está seguro de que desea eliminar
                  {selectedSecciones.length === 1
                    ? 'la sección seleccionada'
                    : `las ${selectedSecciones.length} secciones seleccionadas`}
                  ?
                </p>
                {selectedSecciones.length > 1 && (
                  <ul>
                    {selectedSecciones.map((s) => (
                      <li key={s.ID_SECCION}>
                        {s.NOMBRE_SECCION || s.ID_SECCION}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDeleteSeccion}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <SeccionForm
                initial={modal.data}
                onSubmit={
                  modal.type === 'add' ? handleAddSeccion : handleEditSeccion
                }
                onCancel={closeModal}
                asignaturas={asignaturas} // Pasar lista de asignaturas
                carreras={carreras} // Pasar lista de carreras
                // profesores={profesores} // Pasar lista de profesores si es necesario
              />
            )}
          </Modal>
        )}
        {activeTab === 'asignaturas' && (
          <>
            <AsignaturaFilter
              escuelas={escuelas}
              carrerasOptions={carrerasOptionsForAsignaturaFilter}
              onFilterChange={handleAsignaturaFilterChange}
              currentFilters={asignaturaFilters}
            />
            <AsignaturaActions
              onAdd={() => openModal('add', 'asignatura')}
              onEdit={() => openModal('edit', 'asignatura')}
              onDelete={() => openModal('delete', 'asignatura')}
              selectedAsignaturas={selectedAsignaturas} // Pasar el array
            />
            {loading && paginatedAsignaturas.length === 0 ? (
              <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <p>Cargando asignaturas...</p>
              </div>
            ) : (
              <AsignaturaList
                asignaturas={paginatedAsignaturas}
                selectedAsignaturas={selectedAsignaturas}
                onToggleAsignaturaSelection={handleToggleAsignaturaSelection}
                onToggleSelectAll={handleToggleSelectAllAsignaturas}
                // loading={loading}
              />
            )}
            {!loading && filteredAsignaturas.length > itemsPerPage && (
              <div className="mt-3">
                {/* Añadido margen superior */}
                <PaginationComponent
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredAsignaturas.length}
                  paginate={paginateAsignaturas}
                  currentPage={currentPageAsignaturas}
                />
              </div>
            )}
          </>
        )}
        {modal.type && modal.entity === 'asignatura' && (
          <Modal
            title={
              modal.type === 'add'
                ? 'Agregar Asignatura'
                : modal.type === 'edit'
                  ? 'Editar Asignatura'
                  : `Eliminar Asignatura(s) (${selectedAsignaturas.length})`
            }
            onClose={closeModal}
          >
            {modal.type === 'delete' ? (
              <div>
                <p>
                  ¿Está seguro de que desea eliminar
                  {selectedAsignaturas.length === 1
                    ? 'la asignatura seleccionada'
                    : `las ${selectedAsignaturas.length} asignaturas seleccionadas`}
                  ?
                </p>
                {selectedAsignaturas.length > 1 && (
                  <ul>
                    {selectedAsignaturas.map((a) => (
                      <li key={a.ID_ASIGNATURA}>
                        {a.NOMBRE_ASIGNATURA || a.ID_ASIGNATURA}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDeleteAsignatura}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <AsignaturaForm
                initial={modal.data}
                onSubmit={
                  modal.type === 'add'
                    ? handleAddAsignatura
                    : handleEditAsignatura
                }
                onCancel={closeModal}
                carreras={carreras} // Pasar carreras al formulario
              />
            )}
          </Modal>
        )}
        {activeTab === 'carreras' && (
          <>
            <CarreraFilter
              escuelas={escuelas}
              onFilterChange={handleCarreraFilterChange}
              currentFilters={carreraFilters}
            />
            <CarreraActions
              onAdd={() => openModal('add', 'carrera')}
              onEdit={() => openModal('edit', 'carrera')}
              onDelete={() => openModal('delete', 'carrera')}
              selectedCarreras={selectedCarreras} // Pasar el array
            />
            {loading && paginatedCarreras.length === 0 ? (
              <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <p>Cargando carreras...</p>
              </div>
            ) : (
              <CarreraList
                carreras={paginatedCarreras}
                selectedCarreras={selectedCarreras}
                onToggleCarreraSelection={handleToggleCarreraSelection}
                onToggleSelectAll={handleToggleSelectAllCarreras}
                // loading={loading}
              />
            )}
            {!loading && filteredCarreras.length > itemsPerPage && (
              <div className="mt-3">
                {/* Añadido margen superior */}
                <PaginationComponent
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredCarreras.length}
                  paginate={paginateCarreras}
                  currentPage={currentPageCarreras}
                />
              </div>
            )}
          </>
        )}
        {modal.type && modal.entity === 'carrera' && (
          <Modal
            title={
              modal.type === 'add'
                ? 'Agregar Carrera'
                : modal.type === 'edit'
                  ? 'Editar Carrera'
                  : `Eliminar Carrera(s) (${selectedCarreras.length})`
            }
            onClose={closeModal}
          >
            {modal.type === 'delete' ? (
              <div>
                <p>
                  ¿Está seguro de que desea eliminar
                  {selectedCarreras.length === 1
                    ? 'la carrera seleccionada'
                    : `las ${selectedCarreras.length} carreras seleccionadas`}
                  ?
                </p>
                {selectedCarreras.length > 1 && (
                  <ul>
                    {selectedCarreras.map((c) => (
                      <li key={c.ID_CARRERA}>
                        {c.NOMBRE_CARRERA || c.ID_CARRERA}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDeleteCarrera}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <CarreraForm
                initial={modal.data}
                onSubmit={
                  modal.type === 'add' ? handleAddCarrera : handleEditCarrera
                }
                onCancel={closeModal}
                escuelas={escuelas} // Pasar escuelas al formulario
              />
            )}
          </Modal>
        )}
        {activeTab === 'escuelas' && (
          <>
            <EscuelaFilter
              onFilterChange={handleEscuelaFilterChange}
              currentFilters={escuelaFilters}
            />
            <EscuelaActions
              onAdd={() => openModal('add', 'escuela')}
              onEdit={() => openModal('edit', 'escuela')}
              onDelete={() => openModal('delete', 'escuela')}
              selectedEscuelas={selectedEscuelas} // Pasar el array
            />
            {loading && paginatedEscuelas.length === 0 ? (
              <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <p>Cargando escuelas...</p>
              </div>
            ) : (
              <EscuelaList
                escuelas={paginatedEscuelas}
                selectedEscuelas={selectedEscuelas}
                onToggleEscuelaSelection={handleToggleEscuelaSelection}
                onToggleSelectAll={handleToggleSelectAllEscuelas}
                // loading={loading}
              />
            )}
            {!loading && filteredEscuelas.length > itemsPerPage && (
              <div className="mt-3">
                {/* Añadido margen superior */}
                <PaginationComponent
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredEscuelas.length}
                  paginate={paginateEscuelas}
                  currentPage={currentPageEscuelas}
                />
              </div>
            )}
          </>
        )}
        {modal.type && modal.entity === 'escuela' && (
          <Modal
            title={
              modal.type === 'add'
                ? 'Agregar Escuela'
                : modal.type === 'edit'
                  ? 'Editar Escuela'
                  : `Eliminar Escuela(s) (${selectedEscuelas.length})`
            }
            onClose={closeModal}
          >
            {modal.type === 'delete' ? (
              <div>
                <p>
                  ¿Está seguro de que desea eliminar
                  {selectedEscuelas.length === 1
                    ? 'la escuela seleccionada'
                    : `las ${selectedEscuelas.length} escuelas seleccionadas`}
                  ?
                </p>
                {selectedEscuelas.length > 1 && (
                  <ul>
                    {selectedEscuelas.map((e) => (
                      <li key={e.ID_ESCUELA}>
                        {e.NOMBRE_ESCUELA || e.ID_ESCUELA}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDeleteEscuela}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <EscuelaForm
                initial={modal.data}
                onSubmit={
                  modal.type === 'add' ? handleAddEscuela : handleEditEscuela
                }
                onCancel={closeModal}
                // No se pasan otras listas a EscuelaForm a menos que sea necesario
              />
            )}
          </Modal>
        )}
      </div>
      {/* Cierre del <div className="container-fluid pt-4"> */}
    </Layout>
  );
}
