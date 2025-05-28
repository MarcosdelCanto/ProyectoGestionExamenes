import React, { useState, useMemo } from 'react';
import { FaSearch } from 'react-icons/fa';
import ExamenPostIt from './ExamenPostIt';

// Imports para Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
// Opcional: importa módulos de Swiper si los necesitas (navegación, paginación)
// import 'swiper/css/navigation';
// import 'swiper/css/pagination';
// import { Navigation, Pagination } from 'swiper/modules';

// Imports para dnd-kit
import { useDraggable } from '@dnd-kit/core';

// Componente auxiliar para el elemento arrastrable
function DraggableExamenPostIt({ examen }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `examen-${examen.ID_EXAMEN}`, // ID único para el elemento arrastrable
      data: {
        // Datos que quieres pasar junto con el arrastre
        type: 'examen',
        examen: examen, // Asegúrate de pasar el objeto examen completo
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 100 : 'auto', // Para que el elemento arrastrado esté por encima
        opacity: isDragging ? 0.8 : 1,
      }
    : undefined;

  return (
    <ExamenPostIt
      examen={examen}
      setNodeRef={setNodeRef}
      style={style}
      {...listeners} // Para iniciar el arrastre
      {...attributes} // Para accesibilidad y otros atributos
    />
  );
}

export default function ExamenSelector({
  examenes,
  isLoadingExamenes,
  // ... (otras props como las de filtros si las manejas aquí)
}) {
  const [searchTermExamenes, setSearchTermExamenes] = useState('');
  const [selectedEscuela, setSelectedEscuela] = useState('');
  const [selectedCarrera, setSelectedCarrera] = useState('');
  const [selectedAsignatura, setSelectedAsignatura] = useState('');

  const handleSearchExamenes = (event) => {
    setSearchTermExamenes(event.target.value);
  };

  const filteredExamenes = useMemo(() => {
    let tempExamenes = examenes || [];
    // Lógica de filtrado actualizada (necesitarás los IDs correspondientes en tus objetos de examen)
    if (selectedEscuela) {
      // tempExamenes = tempExamenes.filter(ex => ex.ID_ESCUELA === parseInt(selectedEscuela)); // Ajusta la lógica de comparación y el nombre de la propiedad
    }
    if (selectedCarrera) {
      // tempExamenes = tempExamenes.filter(ex => ex.ID_CARRERA === parseInt(selectedCarrera)); // Ajusta la lógica de comparación y el nombre de la propiedad
    }
    if (selectedAsignatura) {
      // tempExamenes = tempExamenes.filter(ex => ex.ID_ASIGNATURA === parseInt(selectedAsignatura)); // Ajusta la lógica de comparación y el nombre de la propiedad
    }

    if (searchTermExamenes) {
      const lowerSearchTerm = searchTermExamenes.toLowerCase();
      tempExamenes = tempExamenes.filter(
        (examen) =>
          (examen.NOMBRE_ASIGNATURA &&
            examen.NOMBRE_ASIGNATURA.toLowerCase().includes(lowerSearchTerm)) ||
          (examen.NOMBRE_SECCION &&
            examen.NOMBRE_SECCION.toLowerCase().includes(lowerSearchTerm))
        // Puedes añadir más campos al filtro de texto si es necesario
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
  const noHayResultadosDeBusqueda =
    searchTermExamenes && !tieneExamenesParaMostrar && !isLoadingExamenes;
  // Considera si 'listaInicialVacia' sigue siendo relevante con los nuevos filtros
  const listaInicialVacia =
    !searchTermExamenes &&
    !selectedEscuela &&
    !selectedCarrera &&
    !selectedAsignatura &&
    !tieneExamenesParaMostrar &&
    !isLoadingExamenes &&
    examenes &&
    examenes.length === 0;

  // Estilos principales del panel
  const panelPrincipalStyle = {
    // Eliminado: position: 'fixed', top: '0', left: '0', zIndex: 1050
    width: '100%', // Ocupa el 100% del ancho de su contenedor padre
    // height: '280px', // Puedes mantener una altura fija o hacerla adaptable.
    // Si la quitas, la altura se adaptará al contenido.
    // Si la mantienes, asegúrate que sea adecuada para el flujo.
    minHeight: '250px', // Una altura mínima para asegurar que los filtros y algo de espacio para post-its sea visible
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6', // Podrías querer un borde para delimitarlo
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', // Sombra más sutil si está en el flujo
    display: 'flex',
    boxSizing: 'border-box',
    marginBottom: '20px', // Margen para separarlo de lo que venga después
  };

  const seccionFiltrosStyle = {
    flexBasis: '25%',
    padding: '15px',
    borderRight: '1px solid #ced4da',
    overflowY: 'auto',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    // Si panelPrincipalStyle no tiene altura fija, podrías necesitar una altura máxima aquí
    // maxHeight: 'calc(100% - 30px)', // Ejemplo si el panel tiene padding
  };

  const seccionExamenesStyle = {
    flexBasis: '75%',
    padding: '15px',
    overflowX: 'hidden',
    overflowY: 'hidden',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    // Si panelPrincipalStyle no tiene altura fija, podrías necesitar una altura máxima aquí
    // maxHeight: 'calc(100% - 30px)', // Ejemplo
  };

  return (
    <div
      style={panelPrincipalStyle}
      className="examen-selector-panel-integrado" // Cambiado el nombre de la clase para reflejar su nuevo rol
    >
      {/* Sección Izquierda: Filtros */}
      <div style={seccionFiltrosStyle} className="filtros-examenes">
        <h6 className="mb-2 text-secondary">Filtrar Exámenes</h6>

        {/* Select Escuela */}
        <select
          className="form-select form-select-sm"
          value={selectedEscuela}
          onChange={(e) => setSelectedEscuela(e.target.value)}
          aria-label="Seleccionar Escuela"
        >
          <option value="">Todas las Escuelas</option>
          {/* {escuelas.map(escuela => (
            <option key={escuela.id} value={escuela.id}>{escuela.nombre}</option>
          ))} */}
        </select>

        {/* Select Carrera */}
        <select
          className="form-select form-select-sm"
          value={selectedCarrera}
          onChange={(e) => setSelectedCarrera(e.target.value)}
          aria-label="Seleccionar Carrera"
          // disabled={!selectedEscuela} // Opcional: deshabilitar si no hay escuela seleccionada
        >
          <option value="">Todas las Carreras</option>
          {/* Lógica para cargar carreras basadas en la escuela seleccionada */}
          {/* {carreras.filter(c => !selectedEscuela || c.escuelaId === selectedEscuela).map(carrera => (
            <option key={carrera.id} value={carrera.id}>{carrera.nombre}</option>
          ))} */}
        </select>

        {/* Select Asignatura */}
        <select
          className="form-select form-select-sm"
          value={selectedAsignatura}
          onChange={(e) => setSelectedAsignatura(e.target.value)}
          aria-label="Seleccionar Asignatura"
          // disabled={!selectedCarrera} // Opcional
        >
          <option value="">Todas las Asignaturas</option>
          {/* Lógica para cargar asignaturas basadas en la carrera seleccionada */}
          {/* {asignaturas.filter(a => !selectedCarrera || a.carreraId === selectedCarrera).map(asignatura => (
            <option key={asignatura.id} value={asignatura.id}>{asignatura.nombre}</option>
          ))} */}
        </select>

        {/* Buscador actual */}
        <div className="input-group input-group-sm">
          <span className="input-group-text bg-light">
            <FaSearch />
          </span>
          <input
            type="search"
            className="form-control"
            placeholder="Buscar por nombre/sección..."
            value={searchTermExamenes}
            onChange={handleSearchExamenes}
            aria-label="Buscar examen"
          />
        </div>
      </div>

      {/* Sección Derecha: Visualización de Exámenes con Swiper y D&D */}
      <div style={seccionExamenesStyle} className="vista-examenes-postits">
        {isLoadingExamenes ? (
          <div className="d-flex justify-content-center align-items-center w-100 h-100">
            <div
              className="spinner-border text-primary"
              role="status"
              style={{ width: '3rem', height: '3rem' }}
            >
              <span className="visually-hidden">Cargando exámenes...</span>
            </div>
          </div>
        ) : tieneExamenesParaMostrar ? (
          <Swiper
            // modules={[Navigation, Pagination]} // Descomenta si importaste y quieres usar navegación/paginación
            spaceBetween={10} // Espacio entre slides
            slidesPerView={'auto'} // Permite que Swiper determine cuántos caben, o un número fijo
            // navigation // Habilita flechas de navegación
            // pagination={{ clickable: true }} // Habilita puntos de paginación
            style={{ width: '100%', height: '100%' }} // Swiper debe ocupar el contenedor
          >
            {filteredExamenes.map((ex) => (
              <SwiperSlide key={ex.ID_EXAMEN} style={{ width: 'auto' }}>
                {' '}
                {/* width: 'auto' para que tome el tamaño del contenido (ExamenPostIt) */}
                <DraggableExamenPostIt examen={ex} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="d-flex justify-content-center align-items-center w-100 h-100">
            <p className="text-muted fst-italic">
              {noHayResultadosDeBusqueda
                ? `No se encontraron exámenes con "${searchTermExamenes}".`
                : listaInicialVacia &&
                    !selectedEscuela &&
                    !selectedCarrera &&
                    !selectedAsignatura // Solo si no hay filtros aplicados
                  ? 'No hay exámenes disponibles.'
                  : 'No hay exámenes para mostrar con los filtros aplicados.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
