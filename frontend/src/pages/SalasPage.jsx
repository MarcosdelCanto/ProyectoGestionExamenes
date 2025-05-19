import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import SalaForm from '../components/salas/SalaForm';
import SalaList from '../components/salas/SalaList';
import SalaActions from '../components/salas/SalaActions';
import EdificioForm from '../components/edificios/EdificioForm';
import EdificioList from '../components/edificios/EdificioList';
import EdificioActions from '../components/edificios/EdificioActions';
import SedeForm from '../components/sedes/SedeForm';
import SedeList from '../components/sedes/SedeList';
import SedeActions from '../components/sedes/SedeActions';
import { AddSala, EditSala, DeleteSala } from '../services/salaService';
import {
  AddEdificio,
  EditEdificio,
  DeleteEdificio,
} from '../services/edificioService';
import { AddSede, EditSede, DeleteSede } from '../services/sedeService';

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

// Componente Modal Bootstrap
function Modal({ title, children, onClose }) {
  return (
    <div
      className="modal show"
      tabIndex="-1"
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

export default function SalasPage() {
  const [salas, setSalas] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [selectedSala, setSelectedSala] = useState(null);
  const [selectedEdificio, setSelectedEdificio] = useState(null);
  const [selectedSede, setSelectedSede] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState({ type: null, data: null });
  const [activeTab, setActiveTab] = useState('salas');

  // Efectos
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salasDataRes, edificiosDataRes, sedesDataRes] = await Promise.all([
        fetch('http://localhost:3000/api/sala'),
        fetch('http://localhost:3000/api/edificio'),
        fetch('http://localhost:3000/api/sede'),
      ]);
      const salasData = await salasDataRes.json();
      const edificiosData = await edificiosDataRes.json();
      const sedesData = await sedesDataRes.json();
      setSalas(salasData);
      setEdificios(edificiosData);
      setSedes(sedesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de modal
  const openModal = (type, entity) => {
    let data = null;
    if (type === 'edit' || type === 'delete') {
      switch (entity) {
        case 'sala':
          if (!selectedSala) return;
          data = salas.find((s) => s.ID_SALA === selectedSala);
          break;
        case 'edificio':
          if (!selectedEdificio) return;
          data = edificios.find((e) => e.ID_EDIFICIO === selectedEdificio);
          break;
        case 'sede':
          if (!selectedSede) return;
          data = sedes.find((s) => s.ID_SEDE === selectedSede);
          break;
      }
    }
    setModal({ type, entity, data });
  };

  const closeModal = () => setModal({ type: null, data: null });

  // Manejadores para salas
  const handleAddSala = async (form) => {
    try {
      await AddSala(form);
      loadData();
      closeModal();
      setSuccess('Sala creada con éxito');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      setError('Error al crear sala');
      setTimeout(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  const handleEditSala = async (form) => {
    try {
      await EditSala(selectedSala, form);
      loadData();
      closeModal();
      setSuccess('Sala actualizada con éxito');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      setError('Error al actualizar sala');
      console.error('Error:', error);
      setTimeout(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  const handleDeleteSala = async () => {
    try {
      await DeleteSala(selectedSala);
      loadData();
      closeModal();
      setSelectedSala(null);
      setSuccess('Sala eliminada con éxito');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      setError('Error al eliminar sala');
      console.error('Error:', error);
      setTimeout(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  // Manejadores para edificios

  const handleAddEdificio = async (form) => {
    try {
      await AddEdificio(form);
      loadData();
      closeModal();
      setSuccess('Edificio creado con éxito');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      setError('Error al crear edificio');
      setTimeout(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  const handleEditEdificio = async (form) => {
    try {
      await EditEdificio(selectedEdificio, form);
      loadData();
      closeModal();
      setSuccess('Edificio actualizado con éxito');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      setError('Error al actualizar edificio');
      console.error('Error:', error);
      setTimeout(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  const handleDeleteEdificio = async () => {
    try {
      await DeleteEdificio(selectedEdificio);
      loadData();
      closeModal();
      setSelectedEdificio(null);
      setSuccess('Edificio eliminado con éxito');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      setError('Error al eliminar edificio');
      console.error('Error:', error);
      setTimeout(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  // Manejadores para sedes

  const handleAddSede = async (form) => {
    try {
      await AddSede(form);
      loadData();
      closeModal();
      setSuccess('Sede creada con éxito');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      setError('Error al crear sede');
      setTimeout(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  const handleEditSede = async (form) => {
    try {
      await EditSede(selectedSede, form);
      closeModal();
      loadData();
      setSuccess('Sede actualizada con éxito');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      setError('Error al actualizar sede');
      console.error('Error:', error);
      setTimeout(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  const handleDeleteSede = async () => {
    try {
      await DeleteSede(selectedSede);
      loadData();
      closeModal();
      setSelectedSede(null);
      setSuccess('Sede eliminada con éxito');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      loadData();
    } catch (error) {
      setError('Error al eliminar sede');
      console.error('Error:', error);
      setTimeout(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  return (
    <Layout>
      <style>{keyframes}</style>
      <h1 className="mb-4">Gestión de Espacios</h1>
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
            className={`nav-link ${activeTab === 'salas' ? 'active' : ''}`}
            onClick={() => setActiveTab('salas')}
          >
            Salas
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'edificios' ? 'active' : ''}`}
            onClick={() => setActiveTab('edificios')}
          >
            Edificios
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'sedes' ? 'active' : ''}`}
            onClick={() => setActiveTab('sedes')}
          >
            Sedes
          </button>
        </li>
      </ul>

      {activeTab === 'salas' && (
        <>
          <SalaActions
            onAdd={() => openModal('add', 'sala')}
            onEdit={() => openModal('edit', 'sala')}
            onDelete={() => openModal('delete', 'sala')}
            selectedSala={selectedSala}
          />
          <SalaList
            salas={salas}
            selectedSala={selectedSala}
            onSelectSala={setSelectedSala}
            loading={loading}
          />
        </>
      )}

      {modal.type && modal.entity === 'sala' && (
        <Modal
          title={
            modal.type === 'add'
              ? 'Agregar Sala'
              : modal.type === 'edit'
                ? 'Editar Sala'
                : 'Eliminar Sala'
          }
          onClose={closeModal}
        >
          {modal.type === 'delete' ? (
            <div>
              <p>¿Está seguro de que desea eliminar esta sala?</p>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="btn btn-danger" onClick={handleDeleteSala}>
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <SalaForm
              initial={modal.data}
              onSubmit={modal.type === 'add' ? handleAddSala : handleEditSala}
              onCancel={closeModal}
            />
          )}
        </Modal>
      )}

      {activeTab === 'edificios' && (
        <>
          <EdificioActions
            onAdd={() => openModal('add', 'edificio')}
            onEdit={() => openModal('edit', 'edificio')}
            onDelete={() => openModal('delete', 'edificio')}
            selectedEdificio={selectedEdificio}
          />
          <EdificioList
            edificios={edificios}
            selectedEdificio={selectedEdificio}
            onSelectEdificio={setSelectedEdificio}
            loading={loading}
          />
        </>
      )}

      {modal.type && modal.entity === 'edificio' && (
        <Modal
          title={
            modal.type === 'add'
              ? 'Agregar Edificio'
              : modal.type === 'edit'
                ? 'Editar Edificio'
                : 'Eliminar Edificio'
          }
          onClose={closeModal}
        >
          {modal.type === 'delete' ? (
            <div>
              <p>¿Está seguro de que desea eliminar este edificio?</p>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteEdificio}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <EdificioForm
              initial={modal.data}
              onSubmit={
                modal.type === 'add' ? handleAddEdificio : handleEditEdificio
              }
              onCancel={closeModal}
            />
          )}
        </Modal>
      )}

      {activeTab === 'sedes' && (
        <>
          <SedeActions
            onAdd={() => openModal('add', 'sede')}
            onEdit={() => openModal('edit', 'sede')}
            onDelete={() => openModal('delete', 'sede')}
            selectedSede={selectedSede}
          />
          <SedeList
            sedes={sedes}
            selectedSede={selectedSede}
            onSelectSede={setSelectedSede}
            loading={loading}
          />
        </>
      )}

      {modal.type && modal.entity === 'sede' && (
        <Modal
          title={
            modal.type === 'add'
              ? 'Agregar Sede'
              : modal.type === 'edit'
                ? 'Editar Sede'
                : 'Eliminar Sede'
          }
          onClose={closeModal}
        >
          {modal.type === 'delete' ? (
            <div>
              <p>¿Está seguro de que desea eliminar esta sede?</p>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="btn btn-danger" onClick={handleDeleteSede}>
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <SedeForm
              initial={modal.data}
              onSubmit={modal.type === 'add' ? handleAddSede : handleEditSede}
              onCancel={closeModal}
            />
          )}
        </Modal>
      )}
    </Layout>
  );
}
