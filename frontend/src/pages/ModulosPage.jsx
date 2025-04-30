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
function ModuloForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.nombre_modulo || '');
  const [inicio, setInicio] = useState(initial?.inicio_modulo || '');
  const [fin, setFin] = useState(initial?.fin_modulo || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ nombre_modulo: nombre, inicio_modulo: inicio, fin_modulo: fin });
  };

  return (
    <form onSubmit={handleSubmit}>
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
  const [modulos, setModulos] = useState([]);
  const [selected, setSelected] = useState(null);
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
    } catch {
      setError('Error cargando módulos');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type) => {
    if ((type === 'edit' || type === 'delete') && !selected) return;
    const data =
      type === 'edit' ? modulos.find((m) => m.id_modulo === selected) : null;
    setModal({ type, data });
  };
  const closeModal = () => setModal({ type: null, data: null });

  const handleAdd = async (form) => {
    await createModulo(form);
    closeModal();
    loadModulos();
  };
  const handleEdit = async (form) => {
    await updateModulo(selected, form);
    closeModal();
    loadModulos();
  };
  const handleDelete = async () => {
    await deleteModulo(selected);
    closeModal();
    setSelected(null);
    loadModulos();
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
          disabled={!selected}
        >
          Modificar
        </button>
        <button
          className="btn btn-danger"
          onClick={() => openModal('delete')}
          disabled={!selected}
        >
          Eliminar
        </button>
      </div>

      {loading ? (
        <div>Cargando módulos…</div>
      ) : (
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Inicio</th>
              <th>Fin</th>
            </tr>
          </thead>
          <tbody>
            {modulos.map((m) => {
              const id = m.id_modulo ?? m.ID_MODULO;
              const nombre = m.nombre_modulo ?? m.NOMBRE_MODULO;
              const inicio = m.inicio_modulo ?? m.INICIO_MODULO;
              const fin = m.fin_modulo ?? m.FIN_MODULO;
              const isSel = id === selected;
              return (
                <tr
                  key={id}
                  onClick={() => setSelected(id)}
                  className={isSel ? 'table-primary' : ''}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{id}</td>
                  <td>{nombre}</td>
                  <td>{inicio}</td>
                  <td>{fin}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Modals */}
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
