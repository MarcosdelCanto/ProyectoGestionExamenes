import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  fetchAllModulos,
  createModulo,
  updateModulo,
  deleteModulo,
} from '../services/moduloService';
import ModuloTable from '../components/modulos/ModuloTable';
import ModuloForm from '../components/modulos/ModuloForm';
import ModuloActions from '../components/modulos/ModuloActions';

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
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ type: null, data: null });
  const getId = (m) => m.id_modulo ?? m.ID_MODULO;

  useEffect(() => {
    loadModulos();
  }, []);

  const loadModulos = async () => {
    setLoading(true);
    try {
      const res = await fetchAllModulos();
      setModulos(res.data);
      setSelectedModule(null);
      setError('');
    } catch {
      setError('Error cargando módulos');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type) => {
    setError('');
    if ((type === 'edit' || type === 'delete') && !selectedModule) return;
    setError('');
    setModal({ type, data: type === 'edit' ? selectedModule : null });
  };

  const closeModal = () => setModal({ type: null, data: null });

  const handleAdd = async (form) => {
    try {
      await createModulo(form);
      loadModulos();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Error creando módulo');
    }
  };

  const handleEdit = async (form) => {
    try {
      await updateModulo(selectedModule, form);
      closeModal();
      loadModulos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error actualizando módulo');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteModulo(selectedModule);
      closeModal();
      setSelectedModule(null);
      loadModulos();
    } catch {
      setError('Error eliminando módulo');
    }
  };

  return (
    <Layout>
      <h1 className="mb-4">Gestión de Módulos</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <ModuloActions
        onAdd={() => openModal('add')}
        onEdit={() => openModal('edit')}
        onDelete={() => openModal('delete')}
        selectedModule={selectedModule}
      />

      {loading ? (
        <div>Cargando módulos…</div>
      ) : (
        <ModuloTable
          modulos={modulos}
          selectedId={getId(selectedModule)}
          onSelectModule={setSelectedModule}
        />
      )}

      {modal.type === 'add' && (
        <Modal title="Agregar Módulo" onClose={closeModal}>
          <ModuloForm onSubmit={handleAdd} onCancel={closeModal} />
        </Modal>
      )}

      {modal.type === 'edit' && (
        <Modal title="Modificar Módulo" onClose={closeModal}>
          <ModuloForm
            initial={modal.data}
            onSubmit={handleEdit}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal.type === 'delete' && (
        <Modal title="Eliminar Módulo" onClose={closeModal}>
          <p>¿Confirma eliminar el módulo seleccionado?</p>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
