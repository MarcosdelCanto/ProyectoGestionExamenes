import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  fetchAllAsignaturas as fetchAllAsignaturasService,
  createAsignatura as AddAsignatura,
  updateAsignatura as EditAsignatura,
  deleteAsignatura as DeleteAsignatura,
} from '../services/asignaturaService';
import {
  fetchAllSecciones as fetchAllSeccionesService,
  createSeccion as AddSeccion,
  updateSeccion as EditSeccion,
  deleteSeccion as DeleteSeccion,
} from '../services/seccionService';
import {
  createCarrera as AddCarrera,
  updateCarrera as EditCarrera,
  deleteCarrera as DeleteCarrera,
  fetchAllCarreras as fetchAllCarrerasService,
} from '../services/carreraService';
import {
  createEscuela as AddEscuela,
  updateEscuela as EditEscuela,
  deleteEscuela as DeleteEscuela,
  fetchAllEscuelas as fetchAllEscuelasService,
} from '../services/escuelaService';
import PaginationComponent from '../components/PaginationComponent';

import { Alert, Spinner } from 'react-bootstrap';

// --- COMPONENTE MODAL ---
function Modal({ title, children, onClose }) {
  return (
    <div
      className="modal show"
      style={{
        display: 'block',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
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

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function AsignaturasPage() {
  const [secciones, setSecciones] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [selectedAsignaturas, setSelectedAsignaturas] = useState([]);
  const [selectedCarreras, setSelectedCarreras] = useState([]);
  const [selectedEscuelas, setSelectedEscuelas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ type: null, entity: null, data: null });
  const [activeTab, setActiveTab] = useState('secciones');
  const [selectedSecciones, setSelectedSecciones] = useState([]);
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
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [currentPageAsignaturas, setCurrentPageAsignaturas] = useState(1);
  const [currentPageSecciones, setCurrentPageSecciones] = useState(1);
  const [currentPageCarreras, setCurrentPageCarreras] = useState(1);
  const [currentPageEscuelas, setCurrentPageEscuelas] = useState(1);

  const displayMessage = (setter, message, duration = 4000) => {
    setter(message);
    setTimeout(() => {
      setter('');
    }, duration);
  };

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

  useEffect(() => {
    loadData();
  }, [loadData]);

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
          data = selectedAsignaturas;
          break;
        case 'seccion':
          if (selectedSecciones.length === 0) {
            setError(
              'Por favor, seleccione al menos una sección para eliminar.'
            );
            setTimeout(() => setError(''), 5000);
            return;
          }
          data = selectedSecciones;
          break;
        case 'carrera':
          if (selectedCarreras.length === 0) {
            setError(
              'Por favor, seleccione al menos una carrera para eliminar.'
            );
            setTimeout(() => setError(''), 5000);
            return;
          }
          data = selectedCarreras;
          break;
        case 'escuela':
          if (selectedEscuelas.length === 0) {
            setError(
              'Por favor, seleccione al menos una escuela para eliminar.'
            );
            setTimeout(() => setError(''), 5000);
            return;
          }
          data = selectedEscuelas;
          break;
        default:
          break;
      }
    }
    setModal({ type, entity, data });
  };

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
        newFilters.carrera = '';
        newFilters.asignatura = '';
      } else if (changedFilters.carrera !== undefined) {
        newFilters.asignatura = '';
      }
      return newFilters;
    });
    setCurrentPageSecciones(1);
  }, []);

  const carrerasOptionsForAsignaturaFilter = useMemo(() => {
    if (!asignaturaFilters.escuela) return carreras;
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
          if (seccionFilters.carrera || seccionFilters.escuela) return false;
        }
      }
      return (
        matchesNombre && matchesAsignatura && matchesCarrera && matchesEscuela
      );
    });
  }, [secciones, seccionFilters, asignaturas, carreras]);

  const handleAddEscuela = async (form) => {
    try {
      await AddEscuela(form);
      loadData();
      closeModal();
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
    if (selectedEscuelas.length === paginatedEscuelas.length) {
      setSelectedEscuelas([]);
    } else {
      setSelectedEscuelas([...paginatedEscuelas]);
    }
  };

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
    if (selectedAsignaturas.length === paginatedAsignaturas.length) {
      setSelectedAsignaturas([]);
    } else {
      setSelectedAsignaturas([...paginatedAsignaturas]);
    }
  };

  const handleAddAsignatura = async (form) => {
    try {
      await AddAsignatura(form);
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
      await EditAsignatura(selectedAsignaturas[0].ID_ASIGNATURA, form);
      loadData();
      closeModal();
      displayMessage(setSuccess, 'Asignatura actualizada con éxito');
      setSelectedAsignaturas([]);
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
        await DeleteAsignatura(asignatura.ID_ASIGNATURA);
      }
      loadData();
      closeModal();
      displayMessage(
        setSuccess,
        `${selectedAsignaturas.length} asignatura(s) eliminada(s) con éxito`
      );
      setSelectedAsignaturas([]);
    } catch (error) {
      setError(
        'Error al eliminar asignatura(s): ' +
          (error.response?.data?.error || error.message)
      );
      console.error('Error:', error);
      closeModal();
    }
  };

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
      setSelectedSecciones([]);
    } else {
      setSelectedSecciones([...paginatedSecciones]);
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
      await EditSeccion(selectedSecciones[0].ID_SECCION, form);
      loadData();
      closeModal();
      setSuccess('Sección actualizada con éxito');
      setSelectedSecciones([]);
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
      for (const seccion of selectedSecciones) {
        await DeleteSeccion(seccion.ID_SECCION);
      }
      loadData();
      closeModal();
      setSuccess(
        `${selectedSecciones.length} sección(es) eliminada(s) con éxito`
      );
      setSelectedSecciones([]);
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
    if (selectedCarreras.length === paginatedCarreras.length) {
      setSelectedCarreras([]);
    } else {
      setSelectedCarreras([...paginatedCarreras]);
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
      setSelectedCarreras([]);
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
      setSelectedCarreras([]);
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Error al eliminar carrera(s)');
      console.error('Error:', error);
      setTimeout(() => setError(''), 5000);
      closeModal();
    }
  };

  const paginateAsignaturas = (pageNumber) =>
    setCurrentPageAsignaturas(pageNumber);
  const paginateSecciones = (pageNumber) => setCurrentPageSecciones(pageNumber);
  const paginateCarreras = (pageNumber) => setCurrentPageCarreras(pageNumber);
  const paginateEscuelas = (pageNumber) => setCurrentPageEscuelas(pageNumber);

  const getPaginatedData = (items, currentPage) => {
    if (!Array.isArray(items)) return [];
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  };

  const paginatedAsignaturas = getPaginatedData(
    filteredAsignaturas,
    currentPageAsignaturas
  );
  const paginatedSecciones = getPaginatedData(
    filteredSecciones,
    currentPageSecciones
  );
  const paginatedCarreras = getPaginatedData(
    filteredCarreras,
    currentPageCarreras
  );
  const paginatedEscuelas = getPaginatedData(
    filteredEscuelas,
    currentPageEscuelas
  );

  const handleSetTab = (tabName) => {
    setActiveTab(tabName);
    setSelectedAsignaturas([]);
    setSelectedSecciones([]);
    setSelectedCarreras([]);
    setSelectedEscuelas([]);
  };

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

  // --- FUNCIÓN RESTAURADA Y MEJORADA PARA RENDERIZAR EL CONTENIDO DEL MODAL ---
  const renderDeleteModalContent = () => {
    if (!modal.data || modal.data.length === 0)
      return <p>No hay elementos seleccionados.</p>;

    let itemsToDelete = modal.data;
    let itemName = '';
    let itemKeyPrefix = '';
    let nameProperty = '';
    let deleteHandler;
    let consequences = null;
    let icon = 'bi bi-trash';

    switch (modal.entity) {
      case 'escuela':
        itemName = itemsToDelete.length > 1 ? 'escuelas' : 'escuela';
        itemKeyPrefix = 'esc-';
        nameProperty = 'NOMBRE_ESCUELA';
        deleteHandler = handleDeleteEscuela;
        icon = 'bi bi-building';
        consequences = (
          <ul>
            <li>
              Todas las <strong>Carreras</strong> pertenecientes a esta(s)
              escuela(s).
            </li>
            <li>
              Todas las <strong>Asignaturas</strong>, <strong>Secciones</strong>
              , <strong>Exámenes</strong> y <strong>Reservas</strong> asociadas.
            </li>
          </ul>
        );
        break;
      case 'carrera':
        itemName = itemsToDelete.length > 1 ? 'carreras' : 'carrera';
        itemKeyPrefix = 'car-';
        nameProperty = 'NOMBRE_CARRERA';
        deleteHandler = handleDeleteCarrera;
        icon = 'bi bi-mortarboard-fill';
        consequences = (
          <ul>
            <li>
              Todas las <strong>Asignaturas</strong> de esta(s) carrera(s).
            </li>
            <li>
              Todas las <strong>Secciones</strong> de esas asignaturas.
            </li>
            <li>
              Todos los <strong>Exámenes</strong> y <strong>Reservas</strong>{' '}
              asociadas a esas secciones.
            </li>
          </ul>
        );
        break;
      case 'asignatura':
        itemName = itemsToDelete.length > 1 ? 'asignaturas' : 'asignatura';
        itemKeyPrefix = 'asig-';
        nameProperty = 'NOMBRE_ASIGNATURA';
        deleteHandler = handleDeleteAsignatura;
        icon = 'bi bi-book';
        consequences = (
          <ul>
            <li>
              Todas las <strong>Secciones</strong> de esta(s) asignatura(s).
            </li>
            <li>
              Todos los <strong>Exámenes</strong> y <strong>Reservas</strong>{' '}
              asociadas a esas secciones.
            </li>
          </ul>
        );
        break;
      case 'seccion':
        itemName = itemsToDelete.length > 1 ? 'secciones' : 'sección';
        itemKeyPrefix = 'sec-';
        nameProperty = 'NOMBRE_SECCION';
        deleteHandler = handleDeleteSeccion;
        icon = 'bi bi-list-task';
        consequences = (
          <ul>
            <li>
              Todos los <strong>Exámenes</strong> y <strong>Reservas</strong>{' '}
              creados para esta(s) sección(es).
            </li>
            <li>
              Las <strong>asignaciones de docentes</strong> a esta(s)
              sección(es).
            </li>
          </ul>
        );
        break;
      default:
        return <p>Error: Entidad desconocida.</p>;
    }

    return (
      <div>
        <p>
          ¿Está seguro de que desea eliminar {itemsToDelete.length} {itemName}?
        </p>

        <ul className="list-unstyled my-3 p-3 border bg-light rounded">
          {itemsToDelete.map((item, index) => (
            <li key={`${itemKeyPrefix}${index}`}>
              <i className={`${icon} me-2`}></i>
              {item[nameProperty] || `Elemento sin nombre (ID: ${item.ID})`}
            </li>
          ))}
        </ul>

        <Alert variant="danger" className="mt-3">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            ¡Atención! Esta acción es irreversible.
          </Alert.Heading>
          <p className="mb-0">
            Al eliminar, también se borrarán de forma permanente los siguientes
            datos asociados:
          </p>
          <hr />
          {consequences}
        </Alert>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeModal}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={deleteHandler}>
            Sí, entiendo las consecuencias, eliminar
          </button>
        </div>
      </div>
    );
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
              className={`nav-link ${
                activeTab === 'secciones' ? 'active' : ''
              }`}
              onClick={() => handleSetTab('secciones')}
            >
              Secciones
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${
                activeTab === 'asignaturas' ? 'active' : ''
              }`}
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
              />
            )}
            {!loading && filteredSecciones.length > itemsPerPage && (
              <div className="mt-3">
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
              selectedAsignaturas={selectedAsignaturas}
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
              />
            )}
            {!loading && filteredAsignaturas.length > itemsPerPage && (
              <div className="mt-3">
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
              selectedCarreras={selectedCarreras}
              onRefetchData={loadData}
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
              />
            )}
            {!loading && filteredCarreras.length > itemsPerPage && (
              <div className="mt-3">
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
              selectedEscuelas={selectedEscuelas}
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
              />
            )}
            {!loading && filteredEscuelas.length > itemsPerPage && (
              <div className="mt-3">
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

        {modal.type && modal.entity && (
          <Modal
            title={`${
              modal.type.charAt(0).toUpperCase() + modal.type.slice(1)
            } ${modal.entity.charAt(0).toUpperCase() + modal.entity.slice(1)}`}
            onClose={closeModal}
          >
            {modal.type === 'delete' ? (
              renderDeleteModalContent()
            ) : modal.entity === 'seccion' ? (
              <SeccionForm
                initial={modal.data}
                onSubmit={
                  modal.type === 'add' ? handleAddSeccion : handleEditSeccion
                }
                onCancel={closeModal}
                asignaturas={asignaturas}
                carreras={carreras}
              />
            ) : modal.entity === 'asignatura' ? (
              <AsignaturaForm
                initial={modal.data}
                onSubmit={
                  modal.type === 'add'
                    ? handleAddAsignatura
                    : handleEditAsignatura
                }
                onCancel={closeModal}
                carreras={carreras}
              />
            ) : modal.entity === 'carrera' ? (
              <CarreraForm
                initial={modal.data}
                onSubmit={
                  modal.type === 'add' ? handleAddCarrera : handleEditCarrera
                }
                onCancel={closeModal}
                escuelas={escuelas}
              />
            ) : modal.entity === 'escuela' ? (
              <EscuelaForm
                initial={modal.data}
                onSubmit={
                  modal.type === 'add' ? handleAddEscuela : handleEditEscuela
                }
                onCancel={closeModal}
              />
            ) : null}
          </Modal>
        )}
      </div>
    </Layout>
  );
}
