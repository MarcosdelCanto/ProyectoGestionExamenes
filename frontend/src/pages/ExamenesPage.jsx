// src/pages/ExamenesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import ExamenForm from '../components/examenes/ExamenForm';
import ExamenActions from '../components/examenes/ExamenActions';
import ExamenList from '../components/examenes/ExamenList';
import {
  Alert,
  Modal as BootstrapModal,
  Button as BsButton,
  Spinner,
} from 'react-bootstrap'; // Usar Modal y Button de react-bootstrap
import api from '../services/api'; // <-- USA TU INSTANCIA DE AXIOS CONFIGURADA (api.js)

// (Puedes quitar el keyframes y alertStyle si no los necesitas o si manejas las alertas de otra forma)

export default function ExamenesPage() {
  const [examenes, setExamenes] = useState([]);
  const [selectedExamenId, setSelectedExamenId] = useState(null); // Cambiado a selectedExamenId para manejar solo el ID
  const [loading, setLoading] = useState(true); // Inicia en true para la carga inicial
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'add', 'edit', 'delete'
  const [currentExamenData, setCurrentExamenData] = useState(null); // Para editar o eliminar

  // No necesitas activeTab si solo manejas exámenes aquí

  const loadExamenes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Asumimos que tu endpoint en examen.routes.js para GET / es getAllExamenes
      // y que está montado en /api/examen en server.js
      const response = await api.get('/examen'); // Usa tu instancia de Axios
      setExamenes(Array.isArray(response.data) ? response.data : []); // Asegura que sea un array
    } catch (err) {
      console.error('Error al cargar los exámenes:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Error al cargar los exámenes. Intente más tarde.'
      );
      setExamenes([]); // Devuelve array vacío en caso de error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExamenes();
  }, [loadExamenes]);

  useEffect(() => {
    let timer;
    if (success) {
      timer = setTimeout(() => setSuccess(''), 3000);
    }
    if (error) {
      timer = setTimeout(() => setError(''), 5000);
    }
    return () => clearTimeout(timer);
  }, [success, error]);

  const openModalHandler = (type, examenId = null) => {
    setModalType(type);
    if ((type === 'edit' || type === 'delete') && examenId) {
      const examenToProcess = examenes.find((e) => e.ID_EXAMEN === examenId);
      setCurrentExamenData(examenToProcess || null);
    } else {
      setCurrentExamenData(null); // Para 'add'
    }
    setShowModal(true);
  };

  const closeModalHandler = () => {
    setShowModal(false);
    setModalType(null);
    setCurrentExamenData(null);
  };

  const handleFormSubmit = async (formData) => {
    setLoading(true); // Para indicar procesamiento
    try {
      if (modalType === 'add') {
        await api.post('/examen', formData); // Asume que formData tiene el formato correcto
        setSuccess('Examen creado con éxito');
      } else if (modalType === 'edit' && currentExamenData) {
        await api.put(`/examen/${currentExamenData.ID_EXAMEN}`, formData);
        setSuccess('Examen actualizado con éxito');
      }
      await loadExamenes();
      closeModalHandler();
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || 'Error al guardar el examen'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExamen = async () => {
    if (!currentExamenData) return;
    setLoading(true);
    try {
      await api.delete(`/examen/${currentExamenData.ID_EXAMEN}`);
      setSuccess('Examen eliminado con éxito');
      await loadExamenes();
      setSelectedExamenId(null); // Deseleccionar
      closeModalHandler();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Error al eliminar el examen'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container-fluid pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="display-6">
            <i className="bi bi-file-earmark-text-fill me-3"></i>
            Gestión de Exámenes
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

        <ExamenActions
          onAdd={() => openModalHandler('add')}
          onEdit={() => {
            if (selectedExamenId) openModalHandler('edit', selectedExamenId);
            else alert('Por favor, seleccione un examen para editar.');
          }}
          onDelete={() => {
            if (selectedExamenId) openModalHandler('delete', selectedExamenId);
            else alert('Por favor, seleccione un examen para eliminar.');
          }}
          isExamenSelected={!!selectedExamenId} // Para habilitar/deshabilitar botones
        />

        {loading && examenes.length === 0 ? (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p>Cargando exámenes...</p>
          </div>
        ) : (
          <ExamenList
            examenes={examenes} // 'examenes' aquí siempre será un array
            selectedExamenId={selectedExamenId} // Cambiado a selectedExamenId
            onSelectExamen={setSelectedExamenId} // Cambiado a setSelectedExamenId
            loading={loading} // Para mostrar un indicador en la tabla si se está recargando
          />
        )}
      </div>

      {/* Modal para Crear/Editar Examen */}
      {showModal && (modalType === 'add' || modalType === 'edit') && (
        <ExamenForm
          show={showModal}
          handleClose={closeModalHandler}
          handleSubmit={handleFormSubmit}
          initialData={modalType === 'edit' ? currentExamenData : null}
          isProcessing={loading} // Puedes usar el 'loading' general o uno específico
        />
      )}

      {/* Modal de Confirmación para Eliminar Examen */}
      {showModal && modalType === 'delete' && currentExamenData && (
        <BootstrapModal show={showModal} onHide={closeModalHandler} centered>
          <BootstrapModal.Header closeButton>
            <BootstrapModal.Title>Confirmar Eliminación</BootstrapModal.Title>
          </BootstrapModal.Header>
          <BootstrapModal.Body>
            <p>
              ¿Está seguro de que desea eliminar el examen "
              <strong>{currentExamenData.NOMBRE_EXAMEN}</strong>"?
            </p>
          </BootstrapModal.Body>
          <BootstrapModal.Footer>
            <BsButton
              variant="secondary"
              onClick={closeModalHandler}
              disabled={loading}
            >
              Cancelar
            </BsButton>
            <BsButton
              variant="danger"
              onClick={handleDeleteExamen}
              disabled={loading}
            >
              {loading ? (
                <Spinner as="span" size="sm" animation="border" />
              ) : (
                'Eliminar'
              )}
            </BsButton>
          </BootstrapModal.Footer>
        </BootstrapModal>
      )}
    </Layout>
  );
}
