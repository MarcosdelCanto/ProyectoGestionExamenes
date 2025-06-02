// src/pages/SalasPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout'; // Ajusta la ruta si es necesario

// Importa tus servicios (asumiendo que usan tu instancia de 'api' de Axios)
import {
  fetchAllSalas,
  createSala as AddSala, // Renombrado createSala a AddSala
  updateSala as EditSala, // Renombrado updateSala a EditSala
  deleteSalaById, // Renombrado deleteSala a deleteSalaById
} from '../services/salaService'; // Renombrado deleteSala a deleteSalaById
import {
  fetchAllEdificios,
  createEdificio,
  updateEdificio,
  deleteEdificio as deleteEdificioById,
} from '../services/edificioService'; // Renombrado deleteEdificio
import {
  fetchAllSedes,
  createSede,
  updateSede,
  deleteSede as deleteSedeById,
} from '../services/sedeService'; // Renombrado deleteSede

// Importa componentes de UI de React Bootstrap
import { Alert, Spinner } from 'react-bootstrap'; // Modal y Button se usarán implícitamente por los Forms

// Importa tus componentes de UI específicos
import SalaForm from '../components/salas/SalaForm';
import SalaList from '../components/salas/SalaList';
import SalaActions from '../components/salas/SalaActions';
import EdificioForm from '../components/edificios/EdificioForm';
import EdificioList from '../components/edificios/EdificioList';
import EdificioActions from '../components/edificios/EdificioActions';
import SedeForm from '../components/sedes/SedeForm';
import SedeList from '../components/sedes/SedeList';
import SedeActions from '../components/sedes/SedeActions';
import PaginationComponent from '../components/PaginationComponent'; // Asegúrate de que la ruta sea correcta

// Componente Modal Bootstrap Genérico (el que ya tenías, está bien)
function Modal({ title, children, onClose, show }) {
  // Añadida prop 'show'
  if (!show) return null; // No renderizar si no se debe mostrar

  return (
    <div
      className="modal show"
      tabIndex="-1"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        {' '}
        {/* modal-dialog-centered para centrarlo */}
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

export default function SalasPage() {
  const [salas, setSalas] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [sedes, setSedes] = useState([]);

  const [selectedSala, setSelectedSala] = useState(null);
  const [selectedEdificio, setSelectedEdificio] = useState(null);
  const [selectedSede, setSelectedSede] = useState(null);

  const [loading, setLoading] = useState(true); // Para la carga inicial de todas las listas
  const [isProcessing, setIsProcessing] = useState(false); // Para acciones CRUD
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modal, setModal] = useState({
    type: null,
    entity: null,
    data: null,
    show: false,
  }); // Añadido 'show'
  const [activeTab, setActiveTab] = useState('salas');

  const [itemsPerPage] = useState(10);
  const [currentPageSalas, setCurrentPageSalas] = useState(1);
  const [currentPageEdificios, setCurrentPageEdificios] = useState(1);
  const [currentPageSedes, setCurrentPageSedes] = useState(1);

  const displayMessage = (setter, message, duration = 4000) => {
    setter(message);
    setTimeout(() => setter(''), duration);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [salasData, edificiosData, sedesData] = await Promise.all([
        fetchAllSalas(), // Usa tus funciones de servicio que llaman a tu 'api' de Axios
        fetchAllEdificios(),
        fetchAllSedes(),
      ]);
      setSalas(salasData || []); // Asegura que siempre sea un array
      setEdificios(edificiosData || []);
      setSedes(sedesData || []);

      setCurrentPageSalas(1);
      setCurrentPageEdificios(1);
      setCurrentPageSedes(1);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos. ' + (err.message || ''));
      setSalas([]);
      setEdificios([]);
      setSedes([]); // En caso de error, inicializar como arrays vacíos
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModalHandler = (type, entity, selectedEntityData = null) => {
    let dataToModal = null;
    if (type === 'edit' || type === 'delete') {
      switch (entity) {
        case 'sala':
          dataToModal = selectedSala
            ? salas.find((s) => s.ID_SALA === selectedSala.ID_SALA)
            : null; // Usa selectedSala.ID_SALA
          break;
        case 'edificio':
          dataToModal = selectedEdificio
            ? edificios.find(
                (e) => e.ID_EDIFICIO === selectedEdificio.ID_EDIFICIO
              )
            : null;
          break;
        case 'sede':
          dataToModal = selectedSede
            ? sedes.find((s) => s.ID_SEDE === selectedSede.ID_SEDE)
            : null;
          break;
        default:
          break;
      }
      if (!dataToModal && selectedEntityData) dataToModal = selectedEntityData; // Fallback si la selección de tabla no estaba actualizada
    }
    setModal({ type, entity, data: dataToModal, show: true });
  };

  const closeModalHandler = () =>
    setModal({ type: null, entity: null, data: null, show: false });

  // --- Manejadores CRUD ---
  const handleSave = async (entity, form) => {
    setIsProcessing(true);
    setError('');
    setSuccess('');
    try {
      let message = '';
      if (modal.type === 'add') {
        if (entity === 'sala') await AddSala(form);
        else if (entity === 'edificio') await createEdificio(form);
        else if (entity === 'sede') await createSede(form);
        message = `${entity.charAt(0).toUpperCase() + entity.slice(1)} creada con éxito.`;
      } else if (modal.type === 'edit' && modal.data) {
        if (entity === 'sala') await EditSala(modal.data.ID_SALA, form);
        else if (entity === 'edificio')
          await updateEdificio(modal.data.ID_EDIFICIO, form);
        else if (entity === 'sede') await updateSede(modal.data.ID_SEDE, form);
        message = `${entity.charAt(0).toUpperCase() + entity.slice(1)} actualizada con éxito.`;
      }
      displayMessage(setSuccess, message);
      loadData();
      closeModalHandler();
    } catch (err) {
      displayMessage(
        setError,
        `Error al guardar ${entity}: ` +
          (err.response?.data?.error || err.message)
      );
      console.error(`Error guardando ${entity}:`, err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!modal.data || !modal.entity) return;
    setIsProcessing(true);
    setError('');
    setSuccess('');
    const entityName =
      modal.entity.charAt(0).toUpperCase() + modal.entity.slice(1);
    try {
      if (modal.entity === 'sala') await deleteSalaById(modal.data.ID_SALA);
      else if (modal.entity === 'edificio')
        await deleteEdificioById(modal.data.ID_EDIFICIO);
      else if (modal.entity === 'sede')
        await deleteSedeById(modal.data.ID_SEDE);

      displayMessage(setSuccess, `${entityName} eliminada con éxito.`);
      loadData();
      // Deseleccionar la entidad eliminada
      if (modal.entity === 'sala') setSelectedSala(null);
      if (modal.entity === 'edificio') setSelectedEdificio(null);
      if (modal.entity === 'sede') setSelectedSede(null);
      closeModalHandler();
    } catch (err) {
      displayMessage(
        setError,
        `Error al eliminar ${entityName}: ` +
          (err.response?.data?.error || err.message)
      );
      console.error(`Error eliminando ${entityName}:`, err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Funciones de paginación
  const paginateSalas = (pageNumber) => setCurrentPageSalas(pageNumber);
  const paginateEdificios = (pageNumber) => setCurrentPageEdificios(pageNumber);
  const paginateSedes = (pageNumber) => setCurrentPageSedes(pageNumber);

  const getPaginatedData = (items, currentPage) => {
    if (!Array.isArray(items)) return [];
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  };

  const currentSalas = getPaginatedData(salas, currentPageSalas);
  const currentEdificios = getPaginatedData(edificios, currentPageEdificios);
  const currentSedes = getPaginatedData(sedes, currentPageSedes);

  const handleSetTab = (tabName) => {
    setActiveTab(tabName);
    setSelectedSala(null);
    setSelectedEdificio(null);
    setSelectedSede(null); // Limpiar selecciones al cambiar de tab
  };

  // Renderizado
  if (
    loading &&
    salas.length === 0 &&
    edificios.length === 0 &&
    sedes.length === 0
  ) {
    return (
      <Layout>
        <div className="container-fluid mt-4 text-center">
          <Spinner animation="border" variant="primary" />
          <p>Cargando datos...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* <style>{keyframes}</style> // Puedes definir keyframes en un archivo CSS separado */}
      <div className="container-fluid pt-4">
        <div>
          <h2 className="display-6 mb-3">
            <i className="bi bi-door-open-fill me-3"></i>
            Gestión de Espacios
          </h2>
        </div>
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
              className={`nav-link ${activeTab === 'salas' ? 'active' : ''}`}
              onClick={() => handleSetTab('salas')}
            >
              Salas
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'edificios' ? 'active' : ''}`}
              onClick={() => handleSetTab('edificios')}
            >
              Edificios
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'sedes' ? 'active' : ''}`}
              onClick={() => handleSetTab('sedes')}
            >
              Sedes
            </button>
          </li>
        </ul>

        {activeTab === 'salas' && (
          <>
            <SalaActions
              onAdd={() => openModalHandler('add', 'sala')}
              onEdit={() =>
                selectedSala && openModalHandler('edit', 'sala', selectedSala)
              }
              onDelete={() =>
                selectedSala && openModalHandler('delete', 'sala', selectedSala)
              }
              selectedSala={selectedSala}
              disabled={isProcessing}
            />
            <SalaList
              salas={currentSalas}
              selectedSala={selectedSala}
              onSelectSala={setSelectedSala}
              loading={loading} // Para mostrar 'cargando' en la tabla si es necesario
            />
            {!loading && salas.length > itemsPerPage && (
              <PaginationComponent
                itemsPerPage={itemsPerPage}
                totalItems={salas.length}
                paginate={paginateSalas}
                currentPage={currentPageSalas}
              />
            )}
          </>
        )}
        {activeTab === 'edificios' && (
          <>
            <EdificioActions
              onAdd={() => openModalHandler('add', 'edificio')}
              onEdit={() =>
                selectedEdificio &&
                openModalHandler('edit', 'edificio', selectedEdificio)
              }
              onDelete={() =>
                selectedEdificio &&
                openModalHandler('delete', 'edificio', selectedEdificio)
              }
              selectedEdificio={selectedEdificio}
              disabled={isProcessing}
            />
            <EdificioList
              edificios={currentEdificios}
              selectedEdificio={selectedEdificio}
              onSelectEdificio={setSelectedEdificio}
              loading={loading}
            />
            {!loading && edificios.length > itemsPerPage && (
              <PaginationComponent
                itemsPerPage={itemsPerPage}
                totalItems={edificios.length}
                paginate={paginateEdificios}
                currentPage={currentPageEdificios}
              />
            )}
          </>
        )}
        {activeTab === 'sedes' && (
          <>
            <SedeActions
              onAdd={() => openModalHandler('add', 'sede')}
              onEdit={() =>
                selectedSede && openModalHandler('edit', 'sede', selectedSede)
              }
              onDelete={() =>
                selectedSede && openModalHandler('delete', 'sede', selectedSede)
              }
              selectedSede={selectedSede}
              disabled={isProcessing}
            />
            <SedeList
              sedes={currentSedes}
              selectedSede={selectedSede}
              onSelectSede={setSelectedSede}
              loading={loading}
            />
            {!loading && sedes.length > itemsPerPage && (
              <PaginationComponent
                itemsPerPage={itemsPerPage}
                totalItems={sedes.length}
                paginate={paginateSedes}
                currentPage={currentPageSedes}
              />
            )}
          </>
        )}

        {/* Modal Genérico */}
        <Modal
          title={
            modal.type === 'add'
              ? `Agregar ${modal.entity}`
              : modal.type === 'edit'
                ? `Editar ${modal.entity}`
                : `Eliminar ${modal.entity}`
          }
          show={modal.show} // Prop 'show' para el Modal
          onClose={closeModalHandler}
        >
          {modal.type === 'delete' ? (
            <div>
              <p>
                ¿Está seguro de que desea eliminar est
                {modal.entity === 'sede' ? 'a' : 'e'} {modal.entity}?
              </p>
              {modal.data && (
                <p>
                  <strong>
                    {modal.data.NOMBRE_SALA ||
                      modal.data.NOMBRE_EDIFICIO ||
                      modal.data.NOMBRE_SEDE}
                  </strong>
                </p>
              )}
              <div className="modal-footer">
                <BsButton
                  variant="secondary"
                  onClick={closeModalHandler}
                  disabled={isProcessing}
                >
                  Cancelar
                </BsButton>
                <BsButton
                  variant="danger"
                  onClick={handleDelete}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Spinner as="span" size="sm" animation="border" />
                  ) : (
                    'Eliminar'
                  )}
                </BsButton>
              </div>
            </div>
          ) : modal.entity === 'sala' ? (
            <SalaForm
              initialData={modal.data}
              onSubmit={(form) => handleSave('sala', form)}
              onCancel={closeModalHandler}
              isProcessing={isProcessing}
              edificios={edificios}
            />
          ) : modal.entity === 'edificio' ? (
            <EdificioForm
              initialData={modal.data}
              onSubmit={(form) => handleSave('edificio', form)}
              onCancel={closeModalHandler}
              isProcessing={isProcessing}
              sedes={sedes}
            />
          ) : modal.entity === 'sede' ? (
            <SedeForm
              initialData={modal.data}
              onSubmit={(form) => handleSave('sede', form)}
              onCancel={closeModalHandler}
              isProcessing={isProcessing}
            />
          ) : null}
        </Modal>
      </div>
    </Layout>
  );
}
