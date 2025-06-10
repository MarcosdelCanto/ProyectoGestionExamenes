import { useState, useMemo } from 'react';

export function useFilters(salas, examenes) {
  const [searchTermSala, setSearchTermSala] = useState('');
  const [searchTermExamenes, setSearchTermExamenes] = useState('');
  const [selectedSede, setSelectedSede] = useState('');
  const [selectedEdificio, setSelectedEdificio] = useState('');

  const filteredSalas = useMemo(() => {
    let tempSalas = salas || [];

    if (selectedSede) {
      tempSalas = tempSalas.filter((s) => s.ID_SEDE === parseInt(selectedSede));
    }

    if (selectedEdificio) {
      tempSalas = tempSalas.filter(
        (s) => s.ID_EDIFICIO === parseInt(selectedEdificio)
      );
    }

    if (searchTermSala) {
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
