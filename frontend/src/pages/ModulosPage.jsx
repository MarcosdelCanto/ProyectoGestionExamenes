import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ModuloTable from '../components/modulos/ModuloTable';
import ModuloForm from '../components/modulos/ModuloForm';
import ModuloActions from '../components/modulos/moduloActions';
import {
  fetchAllModulos,
  AddModulo,
  EditModulo,
  DeleteModulo,
} from '../services/moduloService';

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

// Bootstrap Modal component
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

export default function ModulosPage() {
  const [modulos, setModulos] = useState([]);
  const [selectedModulo, setSelectedModulo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState({ type: null, data: null });
  const [activeTab, setActiveTab] = useState('modulos');

  useEffect(() => {
    loadModulos();
  }, []);

  const loadModulos = async () => {
    setLoading(true);
    try {
      const res = await fetchAllModulos();
      setModulos(res.data);
      setError('');
      setSelectedModulo(null);
    } catch {
      setError('Error cargando módulos');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, entity) => {
    let data = null;
    if (type === 'edit' || type === 'delete') {
      switch (entity) {
        case 'modulo':
          if (!selectedModulo) return;
          data = modulos.find((m) => m.id_modulo === selectedModulo);
          break;
      }
    }
    setModal({ type, entity, data });
  };

  const closeModal = () => setModal({ type: null, data: null });

  const handleAddModulo = async (form) => {
    try {
      await AddModulo(form);
      setSuccess('Modulo añadido con éxito');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      closeModal();
      loadModulos();
      closeModal();
    } catch (err) {
      setError('Error creando módulo');
      setTimeout(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  const handleEditModulo = async (form) => {
    try {
      await EditModulo(selectedModulo, form);
      setSuccess('Modulo actualizado con éxito');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      closeModal();
      loadModulos();
    } catch (err) {
      setError('Error actualizando módulo');
      setTimeout(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  const handleDeleteModulo = async () => {
    try {
      await DeleteModulo(selectedModulo);
      setSuccess('Modulo Eliminado con éxito');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      closeModal();
      setSelectedModule(null);
      loadModulos();
    } catch {
      setError('Error eliminando módulo');
      setTimeOut(() => {
        setError('');
      }, 5000);
      closeModal();
    }
  };

  return (
    <Layout>
      <style>{keyframes}</style>
      <h1 className="mb-4">Gestión de Módulos</h1>
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
            className={`nav-link ${activeTab === 'modulos' ? 'active' : ''}`}
            onClick={() => setActiveTab('modulos')}
          >
            Módulos
          </button>
        </li>
      </ul>
      {activeTab === 'modulos' && (
        <>
          <ModuloActions
            onAdd={() => openModal('add', 'modulo')}
            onEdit={() => openModal('edit', 'modulo')}
            onDelete={() => openModal('delete', 'modulo')}
            selectedModulo={selectedModulo}
          />
          <ModuloTable
            modulos={modulos}
            selectedModulo={selectedModulo}
            onSelectModulo={setSelectedModulo}
          />
        </>
      )}

      {modal.type && modal.entity === 'modulo' && (
        <Modal
          title={
            modal.type === 'add'
              ? 'Agregar Modulo'
              : modal.type === 'edit'
                ? 'Editar Modulo'
                : 'Eliminar Modulo'
          }
          onClose={closeModal}
        >
          {modal.type === 'delete' ? (
            <div>
              <p>¿Confirma eliminar el módulo seleccionado?</p>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="btn btn-danger" onClick={handleDeleteModulo}>
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <ModuloForm
              initial={modal.data}
              onSubmit={
                modal.type === 'add' ? handleAddModulo : handleEditModulo
              }
              onCancel={closeModal}
            />
          )}
        </Modal>
      )}
    </Layout>
  );
}
