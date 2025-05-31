import { useState, useEffect } from 'react';
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
import {
  createAsignatura as AddAsignatura,
  updateAsignatura as EditAsignatura,
  deleteAsignatura as DeleteAsignatura,
} from '../services/asignaturaService';
import {
  createSeccion as AddSeccion, // Asumiendo que seccionService exporta createSeccion
  updateSeccion as EditSeccion, // Asumiendo que seccionService exporta updateSeccion
  deleteSeccion as DeleteSeccion, // Asumiendo que seccionService exporta deleteSeccion
} from '../services/seccionService';
import {
  createCarrera as AddCarrera, // Asumiendo que carreraService exporta createCarrera
  updateCarrera as EditCarrera, // Asumiendo que carreraService exporta updateCarrera
  deleteCarrera as DeleteCarrera, // Asumiendo que carreraService exporta deleteCarrera
} from '../services/carreraService';
import {
  createEscuela as AddEscuela,
  updateEscuela as EditEscuela,
  deleteEscuela as DeleteEscuela,
} from '../services/escuelaService';
import PaginationComponent from '../components/PaginationComponent'; // Importar PaginationComponent

const alertStyle = {
  animation: 'fadeInOut 5s ease-in-out',
  WebkitAnimation: 'fadeInOut 5s ease-in-out',
  opacity: 1,
};

const keyframes = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(-20px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
  }
`;

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
  const [activeTab, setActiveTab] = useState('asignaturas');
  const [selectedSecciones, setSelectedSecciones] = useState([]);

  // Estados para paginación
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPageAsignaturas, setCurrentPageAsignaturas] = useState(1);
  const [currentPageSecciones, setCurrentPageSecciones] = useState(1);
  const [currentPageCarreras, setCurrentPageCarreras] = useState(1);
  const [currentPageEscuelas, setCurrentPageEscuelas] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [asignaturasRes, carrerasRes, escuelasRes, seccionesRes] =
        await Promise.all([
          fetch('http://localhost:3000/api/asignatura'),
          fetch('http://localhost:3000/api/carrera'),
          fetch('http://localhost:3000/api/escuela'),
          fetch('http://localhost:3000/api/seccion'),
        ]);

      const asignaturasData = await asignaturasRes.json();
      const carrerasData = await carrerasRes.json();
      const escuelasData = await escuelasRes.json();
      const seccionesData = await seccionesRes.json();

      setSecciones(seccionesData);
      setAsignaturas(asignaturasData);
      setCarreras(carrerasData);
      setEscuelas(escuelasData);

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
  };

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

  // --- Funciones CRUD para Escuela ---
  const handleAddEscuela = async (form) => {
    try {
      await AddEscuela(form);
      loadData();
      closeModal();
      setSuccess('Escuela agregada con éxito');
      setTimeout(() => setSuccess(''), 5000);
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
      setSelectedEscuelas([]); // Limpiar selección
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
      setSelectedEscuelas([]); // Limpiar selección
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
    if (selectedEscuelas.length === currentEscuelas.length) {
      setSelectedEscuelas([]);
    } else {
      setSelectedEscuelas([...currentEscuelas]);
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
    if (selectedAsignaturas.length === currentAsignaturas.length) {
      setSelectedAsignaturas([]);
    } else {
      setSelectedAsignaturas([...currentAsignaturas]);
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
    if (selectedSecciones.length === currentSecciones.length) {
      setSelectedSecciones([]);
    } else {
      setSelectedSecciones([...currentSecciones]);
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
    if (selectedCarreras.length === currentCarreras.length) {
      setSelectedCarreras([]);
    } else {
      setSelectedCarreras([...currentCarreras]);
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
  const indexOfLastAsignatura = currentPageAsignaturas * itemsPerPage;
  const indexOfFirstAsignatura = indexOfLastAsignatura - itemsPerPage;
  const currentAsignaturas = asignaturas.slice(
    indexOfFirstAsignatura,
    indexOfLastAsignatura
  );

  const indexOfLastSeccion = currentPageSecciones * itemsPerPage;
  const indexOfFirstSeccion = indexOfLastSeccion - itemsPerPage;
  const currentSecciones = secciones.slice(
    indexOfFirstSeccion,
    indexOfLastSeccion
  );

  const indexOfLastCarrera = currentPageCarreras * itemsPerPage;
  const indexOfFirstCarrera = indexOfLastCarrera - itemsPerPage;
  const currentCarreras = carreras.slice(
    indexOfFirstCarrera,
    indexOfLastCarrera
  );

  const indexOfLastEscuela = currentPageEscuelas * itemsPerPage;
  const indexOfFirstEscuela = indexOfLastEscuela - itemsPerPage;
  const currentEscuelas = escuelas.slice(
    indexOfFirstEscuela,
    indexOfLastEscuela
  );

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
      <style>{keyframes}</style>
      <div>
        <p className="display-5 page-title-custom mb-2">
          <i className="bi bi-briefcase-fill me-3"></i>
          Gestión Administrativa
        </p>
      </div>
      <hr />
      {error && (
        <div className="alert alert-danger" style={alertStyle}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={alertStyle}>
          {success}
        </div>
      )}
      <ul className="nav nav-tabs mb-3">
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
            className={`nav-link ${activeTab === 'secciones' ? 'active' : ''}`}
            onClick={() => handleSetTab('secciones')}
          >
            Secciones
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

      {activeTab === 'asignaturas' && (
        <>
          <AsignaturaActions
            onAdd={() => openModal('add', 'asignatura')}
            onEdit={() => openModal('edit', 'asignatura')}
            onDelete={() => openModal('delete', 'asignatura')}
            selectedAsignaturas={selectedAsignaturas} // Pasar el array
          />
          <AsignaturaList
            asignaturas={currentAsignaturas} // Usar datos paginados
            selectedAsignaturas={selectedAsignaturas} // Pasar el array
            onToggleAsignaturaSelection={handleToggleAsignaturaSelection}
            onToggleSelectAll={handleToggleSelectAllAsignaturas}
            loading={loading}
          />
          {!loading && asignaturas.length > itemsPerPage && (
            <PaginationComponent
              itemsPerPage={itemsPerPage}
              totalItems={asignaturas.length}
              paginate={paginateAsignaturas}
              currentPage={currentPageAsignaturas}
            />
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

      {activeTab === 'secciones' && (
        <>
          <SeccionActions
            onAdd={() => openModal('add', 'seccion')}
            onEdit={() => openModal('edit', 'seccion')}
            onDelete={() => openModal('delete', 'seccion')}
            selectedSecciones={selectedSecciones}
          />
          <SeccionList
            secciones={currentSecciones} // Usar datos paginados
            selectedSecciones={selectedSecciones}
            onToggleSeccionSelection={handleToggleSeccionSelection}
            onToggleSelectAll={handleToggleSelectAllSecciones}
            loading={loading}
          />
          {!loading && secciones.length > itemsPerPage && (
            <PaginationComponent
              itemsPerPage={itemsPerPage}
              totalItems={secciones.length}
              paginate={paginateSecciones}
              currentPage={currentPageSecciones}
            />
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
      {activeTab === 'carreras' && (
        <>
          <CarreraActions
            onAdd={() => openModal('add', 'carrera')}
            onEdit={() => openModal('edit', 'carrera')}
            onDelete={() => openModal('delete', 'carrera')}
            selectedCarreras={selectedCarreras} // Pasar el array
          />
          <CarreraList
            carreras={currentCarreras} // Usar datos paginados
            selectedCarreras={selectedCarreras} // Pasar el array
            onToggleCarreraSelection={handleToggleCarreraSelection}
            onToggleSelectAll={handleToggleSelectAllCarreras}
            loading={loading}
          />
          {!loading && carreras.length > itemsPerPage && (
            <PaginationComponent
              itemsPerPage={itemsPerPage}
              totalItems={carreras.length}
              paginate={paginateCarreras}
              currentPage={currentPageCarreras}
            />
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
          <EscuelaActions
            onAdd={() => openModal('add', 'escuela')}
            onEdit={() => openModal('edit', 'escuela')}
            onDelete={() => openModal('delete', 'escuela')}
            selectedEscuelas={selectedEscuelas} // Pasar el array
          />
          <EscuelaList
            escuelas={currentEscuelas} // Usar datos paginados
            selectedEscuelas={selectedEscuelas} // Pasar el array
            onToggleEscuelaSelection={handleToggleEscuelaSelection}
            onToggleSelectAll={handleToggleSelectAllEscuelas}
            loading={loading}
          />
          {!loading && escuelas.length > itemsPerPage && (
            <PaginationComponent
              itemsPerPage={itemsPerPage}
              totalItems={escuelas.length}
              paginate={paginateEscuelas}
              currentPage={currentPageEscuelas}
            />
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
    </Layout>
  );
}
