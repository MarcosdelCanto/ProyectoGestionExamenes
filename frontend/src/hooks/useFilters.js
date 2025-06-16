import { useState, useMemo } from 'react';

export function useFilters(salas, examenes) {
  const [searchTermSala, setSearchTermSala] = useState('');
  const [searchTermExamenes, setSearchTermExamenes] = useState('');
  const [selectedSede, setSelectedSede] = useState('');
  const [selectedEdificio, setSelectedEdificio] = useState('');

  const filteredSalas = useMemo(() => {
    let tempSalas = salas || [];

    // Filtrar por Sede solo si selectedSede tiene un valor y no es la opción "Todos" (string vacío)
    if (selectedSede && selectedSede !== '') {
      const sedeIdNum = parseInt(selectedSede);
      // Asegurarse de que la conversión a número fue exitosa antes de filtrar
      if (!isNaN(sedeIdNum)) {
        tempSalas = tempSalas.filter((s) => s.ID_SEDE === sedeIdNum);
      }
    }

    // Filtrar por Edificio solo si selectedEdificio tiene un valor y no es la opción "Todos"
    if (selectedEdificio && selectedEdificio !== '') {
      const edificioIdNum = parseInt(selectedEdificio);
      if (!isNaN(edificioIdNum)) {
        tempSalas = tempSalas.filter((s) => {
          const matches = s.EDIFICIO_ID_EDIFICIO === edificioIdNum; // <--- CORRECCIÓN AQUÍ
          return matches;
        });
      }
    }

    // Filtrar por término de búsqueda de sala (SOLO si no está vacío)
    if (searchTermSala && searchTermSala.trim() !== '') {
      const term = searchTermSala.toLowerCase();
      tempSalas = tempSalas.filter(
        (s) =>
          (s.COD_SALA?.toLowerCase() ?? '').includes(term) ||
          (s.NOMBRE_SALA?.toLowerCase() ?? '').includes(term) ||
          (s.NOMBRE_EDIFICIO?.toLowerCase() ?? '').includes(term)
      );
    }

    return tempSalas;
  }, [salas, searchTermSala, selectedSede, selectedEdificio]);

  const filteredExamenes = useMemo(() => {
    if (!examenes) return [];

    return examenes.filter((examen) => {
      return (
        !searchTermExamenes ||
        examen.NOMBRE_ASIGNATURA?.toLowerCase().includes(
          searchTermExamenes.toLowerCase()
        ) ||
        examen.NOMBRE_SECCION?.toLowerCase().includes(
          searchTermExamenes.toLowerCase()
        )
      );
    });
  }, [examenes, searchTermExamenes]);

  return {
    searchTermSala,
    setSearchTermSala,
    searchTermExamenes,
    setSearchTermExamenes,
    selectedSede,
    setSelectedSede,
    selectedEdificio,
    setSelectedEdificio,
    filteredSalas,
    filteredExamenes,
  };
}
