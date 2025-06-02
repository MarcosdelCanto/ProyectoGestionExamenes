import React, { useState, useMemo, useEffect } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';
import ExamenPostIt from './ExamenPostIt';

// Imports para dnd-kit
import { useDraggable } from '@dnd-kit/core';

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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ExamenPostIt
        examen={{ ...examen, CANTIDAD_MODULOS_EXAMEN: currentModulos }}
        onModulosChange={handleModulosChange}
        isPreview={true}
        isBeingDragged={isDragging}
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

  const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    zIndex: 1050,
    width: '90%',
    maxWidth: '500px',
  };

  const backdropStyle = {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1040,
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  };

  const selectContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  };

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
    // width: '100%', // Ya es un div, tomará el ancho del padre flex
    height: '100%', // Para que ocupe la altura asignada por el contenedor flex en CalendarioPage
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    // padding: '5px 5px', // Reducido o ajustado según necesidad
    // marginBottom: '5px', // Eliminado si CalendarioPage maneja el espaciado
  };

  const topControlsContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px', // Añadir un poco de padding aquí
    // marginBottom: '3px', // Reducido o eliminado, el padding puede ser suficiente
    gap: '10px',
    flexShrink: 0, // Para que esta sección no se encoja si el contenido del carrusel es grande
  };

  const searchInputContainerStyle = {
    flexGrow: 1,
  };

  // Estilo para la sección que contendrá el Swiper
  const seccionExamenesStyle = {
    flexGrow: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '10px',
    position: 'relative',
    height: '100%',
    touchAction: 'none', // Importante para el manejo táctil
  };

  // Clave para forzar la re-montura de Swiper si el estado de "tieneExamenes" cambia
  const swiperKey = tieneExamenesParaMostrar
    ? 'swiper-con-examenes'
    : 'swiper-sin-examenes';

  return (
    <>
      <div
        style={panelPrincipalStyle}
        className="examen-selector-panel-integrado"
      >
        <div style={topControlsContainerStyle}>
          <div
            className="input-group input-group-sm"
            style={searchInputContainerStyle}
          >
            <span className="input-group-text bg-light">
              <FaSearch />
            </span>
            <input
              type="search"
              className="form-control"
              placeholder="Buscar Examen por nombre/sección..."
              value={searchTermExamenes}
              onChange={handleSearchExamenes}
              aria-label="Buscar examen"
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

        <div
          style={seccionExamenesStyle}
          className="vista-examenes-postits" // Asegúrate que esta clase no tenga estilos conflictivos
        >
          {isLoadingExamenes ? (
            <div className="d-flex justify-content-center align-items-center w-100 h-100">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : tieneExamenesParaMostrar ? (
            <div className="examenes-container">
              <div
                className="d-flex flex-wrap gap-2 justify-content-center"
                style={{ minHeight: '200px' }}
              >
                {paginatedExamenes.map((ex) => (
                  <DraggableExamenPostIt
                    key={ex.ID_EXAMEN}
                    examen={ex}
                    onModulosChange={handleModulosChange}
                  />
                ))}
              </div>

              {/* Controles de paginación */}
              <div className="d-flex justify-content-center mt-2 gap-2">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>
                <span className="d-flex align-items-center">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  className="btn btn-sm btn-secondary"
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
            <div className="d-flex justify-content-center align-items-center w-100 h-100">
              <p className="text-muted fst-italic">
                No hay exámenes para mostrar.
              </p>
            </div>
          )}
        </div>
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
