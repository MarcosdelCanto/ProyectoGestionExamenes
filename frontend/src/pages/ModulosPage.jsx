import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  fetchAllModulos,
  createModulo,
  updateModulo,
  deleteModulo,
} from '../services/moduloService';

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

// Form inside modal for Add/Edit
function ModuloForm({ initial = {}, onSubmit, onCancel }) {
  // Initialize once from `initial` prop
  const [nombre, setNombre] = useState(
    initial.nombre_modulo ?? initial.NOMBRE_MODULO ?? ''
  );
  const [inicio, setInicio] = useState(
    initial.inicio_modulo ?? initial.INICIO_MODULO ?? ''
  );
  const [fin, setFin] = useState(
    initial.fin_modulo ?? initial.FIN_MODULO ?? ''
  );
  const [orden, setOrden] = useState(initial.orden ?? initial.ORDEN ?? '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_modulo: nombre,
      inicio_modulo: inicio,
      fin_modulo: fin,
      orden: Number(orden),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Orden</label>
        <input
          type="number"
          className="form-control"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          min={1}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Nombre</label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Inicio (HH:mm)</label>
        <input
          type="text"
          className="form-control"
          maxLength={5}
          placeholder="07:30"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          pattern="^\d{2}:\d{2}$"
          title="Formato HH:MM"
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Fin (HH:mm)</label>
        <input
          type="text"
          className="form-control"
          maxLength={5}
          placeholder="09:00"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
          pattern="^\d{2}:\d{2}$"
          title="Formato HH:MM"
          required
        />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          Guardar
        </button>
      </div>
    </form>
  );
}

export default function ModulosPage() {
  // helper to extract primary key (handles Oracle uppercase names)
  const getId = (m) => m.id_modulo ?? m.ID_MODULO;
  const [modulos, setModulos] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ type: null, data: null });

  useEffect(() => {
    loadModulos();
  }, []);

  const loadModulos = async () => {
    setLoading(true);
    try {
      const res = await fetchAllModulos();
      setModulos(res.data);
      setError('');
      setSelectedModule(null);
    } catch {
      setError('Error cargando módulos');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type) => {
    setError('');
    if ((type === 'edit' || type === 'delete') && !selectedModule) return;
    setModal({ type, data: type === 'edit' ? selectedModule : null });
  };

  const closeModal = () => setModal({ type: null, data: null });

  const handleAdd = async (form) => {
    try {
      await createModulo(form);
      closeModal();
      loadModulos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error creando módulo');
    }
  };

  const handleEdit = async (form) => {
    try {
      await updateModulo(getId(selectedModule), form);
      closeModal();
      loadModulos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error actualizando módulo');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteModulo(getId(selectedModule));
      closeModal();
      loadModulos();
    } catch {
      setError('Error eliminando módulo');
    }
  };

  return (
    <Layout>
      <h1 className="mb-4">Gestión de Módulos</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="mb-3">
        <button
          className="btn btn-success me-2"
          onClick={() => openModal('add')}
        >
          Agregar
        </button>
        <button
          className="btn btn-warning me-2"
          onClick={() => openModal('edit')}
          disabled={!selectedModule}
        >
          Modificar
        </button>
        <button
          className="btn btn-danger"
          onClick={() => openModal('delete')}
          disabled={!selectedModule}
        >
          Eliminar
        </button>
      </div>

      {loading ? (
        <div>Cargando módulos…</div>
      ) : (
        <div
          className="table-responsive border"
          style={{
            maxHeight: '60vh',
            overflowY: 'auto',
            marginBottom: '1rem',
          }}
        >
          <table className="table table-bordered mb-0">
            <thead className="table-light position-sticky top-0">
              <tr>
                <th style={{ top: 0, zIndex: 1 }}>Orden</th>
                <th style={{ top: 0, zIndex: 1 }}>Nombre</th>
                <th style={{ top: 0, zIndex: 1 }}>Inicio</th>
                <th style={{ top: 0, zIndex: 1 }}>Fin</th>
              </tr>
            </thead>
            <tbody>
              {modulos
                .sort((a, b) => (a.orden ?? a.ORDEN) - (b.orden ?? b.ORDEN))
                .map((m) => {
                  const isSel =
                    selectedModule && getId(selectedModule) === getId(m);
                  return (
                    <tr
                      key={getId(m)}
                      onClick={() => setSelectedModule(m)}
                      className={isSel ? 'table-primary' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{m.orden ?? m.ORDEN}</td>
                      <td>{m.nombre_modulo ?? m.NOMBRE_MODULO}</td>
                      <td>{m.inicio_modulo ?? m.INICIO_MODULO}</td>
                      <td>{m.fin_modulo ?? m.FIN_MODULO}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {modal.type === 'add' && (
        <Modal title="Agregar Módulo" onClose={closeModal}>
          {error && <div className="alert alert-danger mb-2">{error}</div>}
          <ModuloForm onSubmit={handleAdd} onCancel={closeModal} />
        </Modal>
      )}

      {modal.type === 'edit' && (
        <Modal title="Modificar Módulo" onClose={closeModal}>
          {error && <div className="alert alert-danger mb-2">{error}</div>}
          <ModuloForm
            initial={modal.data}
            onSubmit={handleEdit}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal.type === 'delete' && (
        <Modal title="Eliminar Módulo" onClose={closeModal}>
          {error && <div className="alert alert-danger mb-2">{error}</div>}
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
