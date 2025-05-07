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
  AddAsignatura,
  EditAsignatura,
  DeleteAsignatura,
} from '../services/asignaturaService';
import {
  AddSeccion,
  EditSeccion,
  DeleteSeccion,
} from '../services/seccionService';
import {
  AddCarrera,
  EditCarrera,
  DeleteCarrera,
} from '../services/carreraService';
import {
  AddEscuela,
  EditEscuela,
  DeleteEscuela,
} from '../services/escuelaService';

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
  const [selectedSeccion, setSelectedSeccion] = useState(null);
  const [selectedAsignatura, setSelectedAsignatura] = useState(null);
  const [selectedCarrera, setSelectedCarrera] = useState(null);
  const [selectedEscuela, setSelectedEscuela] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ type: null, data: null });
  const [activeTab, setActiveTab] = useState('asignaturas');

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
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      setError(
        'Error al cargar los datos. Por favor, inténtalo de nuevo más tarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, entity) => {
    let data = null;
    if (type === 'edit' || type === 'delete') {
      switch (entity) {
        case 'asignatura':
          if (!selectedAsignatura) return;
          data = asignaturas.find(
            (a) => a.ID_ASIGNATURA === selectedAsignatura
          );
          break;
        case 'seccion':
          if (!selectedSeccion) return;
          data = secciones.find((s) => s.ID_SECCION === selectedSeccion);
          break;
        case 'carrera':
          if (!selectedCarrera) return;
          data = carreras.find((c) => c.ID_CARRERA === selectedCarrera);
          break;
        case 'escuela':
          if (!selectedEscuela) return;
          data = escuelas.find((e) => e.ID_ESCUELA === selectedEscuela);
          break;
      }
    }
    setModal({ type, entity, data });
  };

  const closeModal = () => setModal({ type: null, data: null });

  //Manejadores
  const handleAddAsignatura = async (form) => {
    try {
      await AddAsignatura(form);
      loadData();
      closeModal();
    } catch (error) {
      setError('Error al crear asignatura');
      closeModal();
    }
  };

  const handleEditAsignatura = async (form) => {
    try {
      await EditAsignatura(selectedAsignatura, form);
      closeModal();
      loadData();
    } catch (error) {
      setError('Error al actualizar asignatura');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleDeleteAsignatura = async () => {
    try {
      await DeleteAsignatura(selectedAsignatura);
      closeModal();
      setSelectedAsignatura(null);
      loadData();
    } catch (error) {
      setError('Error al eliminar asignatura');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleAddSeccion = async (form) => {
    try {
      await AddSeccion(form);
      loadData();
      closeModal();
    } catch (error) {
      setError('Error al crear seccion');
      closeModal();
    }
  };

  const handleEditSeccion = async (form) => {
    try {
      await EditSeccion(selectedSeccion, form);
      closeModal();
      loadData();
    } catch (error) {
      setError('Error al actualizar seccion');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleDeleteSeccion = async () => {
    try {
      await DeleteSeccion(selectedSeccion);
      closeModal();
      setSelectedSeccion(null);
      loadData();
    } catch (error) {
      setError('Error al eliminar seccion');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleAddCarrera = async (form) => {
    try {
      await AddCarrera(form);
      loadData();
      closeModal();
    } catch (error) {
      setError('Error al crear carrera');
      closeModal();
    }
  };

  const handleEditCarrera = async (form) => {
    try {
      await EditCarrera(selectedCarrera, form);
      closeModal();
      loadData();
    } catch (error) {
      setError('Error al actualizar carrera');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleDeleteCarrera = async () => {
    try {
      await DeleteCarrera(selectedCarrera);
      closeModal();
      setSelectedCarrera(null);
      loadData();
    } catch (error) {
      setError('Error al eliminar carrera');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleAddEscuela = async (form) => {
    try {
      await AddEscuela(form);
      loadData();
      closeModal();
    } catch (error) {
      setError('Error al crear escuela');
      closeModal();
    }
  };

  const handleEditEscuela = async (form) => {
    try {
      await EditEscuela(selectedEscuela, form);
      closeModal();
      loadData();
    } catch (error) {
      setError('Error al actualizar escuela');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleDeleteEscuela = async () => {
    try {
      await DeleteEscuela(selectedEscuela);
      closeModal();
      setSelectedEscuela(null);
      loadData();
    } catch (error) {
      setError('Error al eliminar escuela');
      console.error('Error:', error);
      closeModal();
    }
  };

  return (
    <Layout>
      <h1 className="mb-4">Gestion Administrativa</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'asignaturas' ? 'active' : ''}`}
            onClick={() => setActiveTab('asignaturas')}
          >
            Asignaturas
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'secciones' ? 'active' : ''}`}
            onClick={() => setActiveTab('secciones')}
          >
            Secciones
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'carreras' ? 'active' : ''}`}
            onClick={() => setActiveTab('carreras')}
          >
            Carreras
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'escuelas' ? 'active' : ''}`}
            onClick={() => setActiveTab('escuelas')}
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
            selectedAsignatura={selectedAsignatura}
          />
          <AsignaturaList
            asignaturas={asignaturas}
            selectedAsignatura={selectedAsignatura}
            onSelectAsignatura={setSelectedAsignatura}
            loading={loading}
          />
        </>
      )}

      {modal.type && modal.entity === 'asignatura' && (
        <Modal
          title={
            modal.type === 'add'
              ? 'Agregar Asignatura'
              : modal.type === 'edit'
                ? 'Editar Asignatura'
                : 'Eliminar Asignatura'
          }
          onClose={closeModal}
        >
          {modal.type === 'delete' ? (
            <div>
              <p>¿Está seguro de que desea eliminar esta asignatura?</p>
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
            selectedSeccion={selectedSeccion}
          />
          <SeccionList
            secciones={secciones}
            selectedSeccion={selectedSeccion}
            onSelectSeccion={setSelectedSeccion}
            loading={loading}
          />
        </>
      )}

      {modal.type && modal.entity === 'seccion' && (
        <Modal
          title={
            modal.type === 'add'
              ? 'Agregar Sección'
              : modal.type === 'edit'
                ? 'Editar Sección'
                : 'Eliminar Sección'
          }
          onClose={closeModal}
        >
          {modal.type === 'delete' ? (
            <div>
              <p>¿Está seguro de que desea eliminar esta sección?</p>
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
            selectedCarrera={selectedCarrera}
          />
          <CarreraList
            carreras={carreras}
            selectedCarrera={selectedCarrera}
            onSelectCarrera={setSelectedCarrera}
            loading={loading}
          />
        </>
      )}

      {modal.type && modal.entity === 'carrera' && (
        <Modal
          title={
            modal.type === 'add'
              ? 'Agregar Carrera'
              : modal.type === 'edit'
                ? 'Editar Carrera'
                : 'Eliminar Carrera'
          }
          onClose={closeModal}
        >
          {modal.type === 'delete' ? (
            <div>
              <p>¿Está seguro de que desea eliminar esta carrera?</p>
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
            selectedEscuela={selectedEscuela}
          />
          <EscuelaList
            escuelas={escuelas}
            selectedEscuela={selectedEscuela}
            onSelectEscuela={setSelectedEscuela}
            loading={loading}
          />
        </>
      )}

      {modal.type && modal.entity === 'escuela' && (
        <Modal
          title={
            modal.type === 'add'
              ? 'Agregar Escuela'
              : modal.type === 'edit'
                ? 'Editar Escuela'
                : 'Eliminar Escuela'
          }
          onClose={closeModal}
        >
          {modal.type === 'delete' ? (
            <div>
              <p>¿Está seguro de que desea eliminar esta escuela?</p>
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
            />
          )}
        </Modal>
      )}
    </Layout>
  );
}
