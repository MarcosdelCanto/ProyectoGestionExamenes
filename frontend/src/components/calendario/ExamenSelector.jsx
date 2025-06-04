import React, { useState, useMemo, useEffect } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';
import ExamenPostIt from './ExamenPostIt';
import { useDraggable } from '@dnd-kit/core';
import './styles/ExamenSelector.css';

// Componente auxiliar para el elemento arrastrable (se mantiene igual)
function DraggableExamenPostIt({ examen, onModulosChange }) {
  const [currentModulos, setCurrentModulos] = useState(
    examen.CANTIDAD_MODULOS_EXAMEN || 1
  );

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `examen-${examen.ID_EXAMEN}`,
      data: {
        type: 'examen',
        examen: { ...examen, CANTIDAD_MODULOS_EXAMEN: currentModulos },
      },
    });

  // estilo de transformacion controlados por dnd-kit
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 1000 : 'auto',
        opacity: isDragging ? 0.8 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none', // Evitar problemas de arrastre en dispositivos táctiles
      }
    : undefined;

  // Manejador para el cambio de módulos
  const handleModulosChange = (id, newCount) => {
    setCurrentModulos(newCount);
    if (onModulosChange) {
      onModulosChange(id, newCount);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        margin: 0,
        padding: 0,
        width: '100%',
        height: '100%',
      }}
      {...attributes}
      {...listeners}
      data-modulos={currentModulos}
      className="draggable-examen"
    >
      <ExamenPostIt
        examen={{ ...examen, CANTIDAD_MODULOS_EXAMEN: currentModulos }}
        onModulosChange={handleModulosChange}
        isPreview={true}
        isBeingDragged={isDragging}
        handleRemove={() => {}} // Manejador vacío
      />
    </div>
  );
}

// Componente para el Modal de Filtros (ahora solo con selects)
function FilterModal({
  isOpen,
  onClose,
  selectedEscuela,
  setSelectedEscuela,
  selectedCarrera,
  setSelectedCarrera,
  selectedAsignatura,
  setSelectedAsignatura,
  // escuelas, carreras, asignaturas // Props para poblar los selects
}) {
  if (!isOpen) return null;

  return (
    <>
      <div style={backdropStyle} onClick={onClose}></div>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h5>Filtros Adicionales</h5>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={onClose}
          ></button>
        </div>
        <div style={selectContainerStyle}>
          {/* Select Escuela */}
          <select
            className="form-select form-select-sm"
            value={selectedEscuela}
            onChange={(e) => setSelectedEscuela(e.target.value)}
            aria-label="Seleccionar Escuela"
          >
            <option value="">Todas las Escuelas</option>
            {/* Ejemplo: escuelas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>) */}
          </select>

          {/* Select Carrera */}
          <select
            className="form-select form-select-sm"
            value={selectedCarrera}
            onChange={(e) => setSelectedCarrera(e.target.value)}
            aria-label="Seleccionar Carrera"
          >
            <option value="">Todas las Carreras</option>
            {/* Ejemplo: carreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>) */}
          </select>

          {/* Select Asignatura */}
          <select
            className="form-select form-select-sm"
            value={selectedAsignatura}
            onChange={(e) => setSelectedAsignatura(e.target.value)}
            aria-label="Seleccionar Asignatura"
          >
            <option value="">Todas las Asignaturas</option>
            {/* Ejemplo: asignaturas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>) */}
          </select>
        </div>
        <div className="mt-3 d-flex justify-content-end">
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Aplicar y Cerrar
          </button>
        </div>
      </div>
    </>
  );
}

export default function ExamenSelector({
  examenes,
  isLoadingExamenes,
  onExamenModulosChange,
}) {
  const [searchTermExamenes, setSearchTermExamenes] = useState('');
  const [selectedEscuela, setSelectedEscuela] = useState('');
  const [selectedCarrera, setSelectedCarrera] = useState('');
  const [selectedAsignatura, setSelectedAsignatura] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Ajusta según necesites

  const handleSearchExamenes = (event) => {
    setSearchTermExamenes(event.target.value);
  };
  const handleModulosChange = (examenId, newModulosCount) => {
    if (onExamenModulosChange) {
      onExamenModulosChange(examenId, newModulosCount);
    }
  };

  const filteredExamenes = useMemo(() => {
    let tempExamenes = examenes || [];
    if (selectedEscuela) {
      // tempExamenes = tempExamenes.filter(ex => ex.ID_ESCUELA === parseInt(selectedEscuela));
    }
    if (selectedCarrera) {
      // tempExamenes = tempExamenes.filter(ex => ex.ID_CARRERA === parseInt(selectedCarrera));
    }
    if (selectedAsignatura) {
      // tempExamenes = tempExamenes.filter(ex => ex.ID_ASIGNATURA === parseInt(selectedAsignatura));
    }
    if (searchTermExamenes) {
      const lowerSearchTerm = searchTermExamenes.toLowerCase();
      tempExamenes = tempExamenes.filter(
        (examen) =>
          (examen.NOMBRE_ASIGNATURA &&
            examen.NOMBRE_ASIGNATURA.toLowerCase().includes(lowerSearchTerm)) ||
          (examen.NOMBRE_SECCION &&
            examen.NOMBRE_SECCION.toLowerCase().includes(lowerSearchTerm))
      );
    }
    return tempExamenes;
  }, [
    examenes,
    searchTermExamenes,
    selectedEscuela,
    selectedCarrera,
    selectedAsignatura,
  ]);

  const tieneExamenesParaMostrar =
    filteredExamenes && filteredExamenes.length > 0;

  // Calcular exámenes para la página actual
  const paginatedExamenes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredExamenes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredExamenes, currentPage]);

  const totalPages = Math.ceil(filteredExamenes.length / itemsPerPage);

  // Estilo para el panel principal que contiene todo el ExamenSelector
  const panelPrincipalStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%', // Ocupa toda la altura disponible
    backgroundColor: '#fff',
    borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  };

  const topControlsContainerStyle = {
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  };

  const searchInputContainerStyle = {
    flexGrow: 1,
  };

  return (
    <>
      <div className="contenedor-examenes-pendientes">
        <div className="examen-search-container">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-light">
              <FaSearch />
            </span>
            <input
              type="search"
              className="form-control"
              placeholder="Buscar Examen..."
              value={searchTermExamenes}
              onChange={handleSearchExamenes}
            />
          </div>
          <button
            className="btn btn-light btn-sm"
            onClick={() => setShowFilterModal(true)}
            title="Más filtros"
          >
            <FaFilter />
          </button>
        </div>

        {tieneExamenesParaMostrar ? (
          <div className="examenes-container">
            <div className="vista-examenes-postits">
              {paginatedExamenes.map((ex) => (
                <div className="draggable-examen-wrapper" key={ex.ID_EXAMEN}>
                  <DraggableExamenPostIt
                    examen={ex}
                    onModulosChange={handleModulosChange}
                  />
                </div>
              ))}
            </div>

            <div className="pagination-controls">
              <button
                className="btn btn-sm btn-light"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="pagination-info">
                {currentPage} / {totalPages}
              </span>
              <button
                className="btn btn-sm btn-light"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : (
          <div className="d-flex justify-content-center align-items-center h-100">
            <p className="text-muted">No hay exámenes disponibles.</p>
          </div>
        )}
      </div>

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedEscuela={selectedEscuela}
        setSelectedEscuela={setSelectedEscuela}
        selectedCarrera={selectedCarrera}
        setSelectedCarrera={setSelectedCarrera}
        selectedAsignatura={selectedAsignatura}
        setSelectedAsignatura={setSelectedAsignatura}
      />
    </>
  );
}
