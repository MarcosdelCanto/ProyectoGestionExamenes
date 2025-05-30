import React, { useState, useMemo, useEffect } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';
import ExamenPostIt from './ExamenPostIt';
import { FaGripLines } from 'react-icons/fa';
//prueba para git
// Imports para Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Imports para dnd-kit
import { useDraggable } from '@dnd-kit/core';
import { set } from 'date-fns';

// Componente auxiliar para el elemento arrastrable (se mantiene igual)
function DraggableExamenPostIt({ examen, onModulosChange }) {
  const [currentModulos, setCurrentModulos] = useState(
    examen.CANTIDAD_MODULOS_EXAMEN
  );

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `examen-${examen.ID_EXAMEN}`,
      data: {
        type: 'examen',
        examen: { ...examen, CANTIDAD_MODULOS_EXAMEN: currentModulos },
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 1000 : 'auto',
        opacity: isDragging ? 0.8 : 1,
      }
    : undefined;

  const handleModulosChange = (id, newModulosCount) => {
    setCurrentModulos(newModulosCount);
    if (onModulosChange) {
      onModulosChange(id, newModulosCount);
    }
  };

  return (
    <ExamenPostIt
      examen={{ ...examen, CANTIDAD_MODULOS_EXAMEN: currentModulos }}
      setNodeRef={setNodeRef}
      style={style}
      onModulosChange={handleModulosChange}
      {...listeners}
      {...attributes}
    />
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
    overflow: 'hidden', // ¡CRUCIAL!
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '30px', // O la altura que necesites para tus post-its
    padding: '1px 0',
    position: 'relative', // Para el posicionamiento de los elementos de Swiper
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
            <Swiper
              key={swiperKey}
              modules={[Navigation, Pagination]}
              spaceBetween={10}
              slidesPerView={'auto'}
              navigation
              pagination={{ clickable: true }}
              style={{
                width: '100%',
                height: '100%',
                padding: '0 1px', // Ajusta el padding según sea necesario
                margin: 0, // Asegúrate que no haya margen que afecte el layout
                // overflow: 'hidden', // Añadir esto aquí es una prueba si el CSS global no funciona
              }}
              className="mySwiper" // Asegúrate que esta clase no oculte Swiper o sus hijos
            >
              {filteredExamenes.map((ex) => (
                <SwiperSlide
                  key={ex.ID_EXAMEN}
                  style={{
                    width: 'auto', // Para que el slide tome el ancho del ExamenPostIt
                    display: 'flex',
                    padding: 0, // Añadir esto para eliminar el padding
                  }}
                >
                  <DraggableExamenPostIt
                    examen={ex}
                    onModulosChange={handleModulosChange}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
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
