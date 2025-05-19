import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ExamenForm from '../components/examenes/ExamenForm';
import ExamenActions from '../components/examenes/ExamenActions';
import ExamenList from '../components/examenes/ExamenList';

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

export default function ExamenesPage() {
  const [examenes, setExamenes] = useState([]);
  const [selectedExamen, setSelectedExamen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState({ type: null, data: null });
  const [activeTab, setActiveTab] = useState('examenes');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const examenesRes = await fetch('http://localhost:3000/api/examen');
      const examenesData = await examenesRes.json();
      setExamenes(examenesData);
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
        case 'examen':
          if (!selectedExamen) return;
          data = examenes.find((e) => e.ID_EXAMEN === selectedExamen);
          break;
      }
    }
    setModal({ type, entity, data });
  };

  const closeModal = () => setModal({ type: null, data: null });

  const handleAddExamen = async (form) => {
    try {
      const response = await fetch('http://localhost:3000/api/examen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Error al crear examen');
      await loadData();
      closeModal();
      setSuccess('Examen creado con éxito');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Error al crear examen');
      setTimeout(() => setError(''), 5000);
      closeModal();
    }
  };

  const handleEditExamen = async (form) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/examen/${selectedExamen}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      if (!response.ok) throw new Error('Error al actualizar examen');
      await loadData();
      closeModal();
      setSuccess('Examen actualizado con éxito');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Error al actualizar examen');
      setTimeout(() => setError(''), 5000);
      closeModal();
    }
  };

  const handleDeleteExamen = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/examen/${selectedExamen}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) throw new Error('Error al eliminar examen');
      await loadData();
      closeModal();
      setSelectedExamen(null);
      setSuccess('Examen eliminado con éxito');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Error al eliminar examen');
      setTimeout(() => setError(''), 5000);
      closeModal();
    }
  };

  return (
    <Layout>
      <style>{keyframes}</style>
      <h1 className="mb-4">Gestión de Exámenes</h1>
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
            className={`nav-link ${activeTab === 'examenes' ? 'active' : ''}`}
            onClick={() => setActiveTab('examenes')}
          >
            Examenes
          </button>
        </li>
      </ul>

      {activeTab === 'examenes' && (
        <>
          <ExamenActions
            onAdd={() => openModal('add', 'examen')}
            onEdit={() => openModal('edit', 'examen')}
            onDelete={() => openModal('delete', 'examen')}
            selectedExamen={selectedExamen}
          />
          <ExamenList
            examenes={examenes}
            selectedExamen={selectedExamen}
            onSelectExamen={setSelectedExamen}
            loading={loading}
          />
        </>
      )}

      {modal.type && modal.entity === 'examen' && (
        <Modal
          title={
            modal.type === 'add'
              ? 'Agregar examen'
              : modal.type === 'edit'
                ? 'Editar examen'
                : 'Eliminar examen'
          }
          onClose={closeModal}
        >
          {modal.type === 'delete' ? (
            <div>
              <p>¿Está seguro de que desea eliminar este examen?</p>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="btn btn-danger" onClick={handleDeleteExamen}>
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <ExamenForm
              initial={modal.data}
              onSubmit={
                modal.type === 'add' ? handleAddExamen : handleEditExamen
              }
              onCancel={closeModal}
            />
          )}
        </Modal>
      )}
    </Layout>
  );
}
