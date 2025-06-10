import React, { useState, useEffect, useCallback } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { searchDocentes } from '../../services/usuarioService';
import _ from 'lodash'; // Necesitarás instalar lodash: npm install lodash

const SearchableCheckboxList = ({ selectedIds, onSelectionChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Usamos useCallback y debounce para no llamar a la API en cada pulsación de tecla
  const debouncedSearch = useCallback(
    _.debounce(async (term) => {
      if (term) {
        setIsLoading(true);
        try {
          const data = await searchDocentes(term);
          setResults(data);
        } catch (error) {
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300), // Espera 300ms después de que el usuario deja de escribir
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleCheckboxChange = (docenteId) => {
    const newSelectedIds = selectedIds.includes(docenteId)
      ? selectedIds.filter((id) => id !== docenteId)
      : [...selectedIds, docenteId];
    onSelectionChange(newSelectedIds);
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>Docente(s) Asignado(s)</Form.Label>
      <Form.Control
        type="text"
        placeholder="Buscar docente por nombre..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />
      <div
        style={{
          maxHeight: '150px',
          overflowY: 'auto',
          border: '1px solid #ced4da',
          padding: '1rem',
          borderRadius: '.25rem',
        }}
      >
        {isLoading && <Spinner animation="border" size="sm" />}
        {!isLoading && results.length === 0 && searchTerm && (
          <p className="text-muted">No se encontraron docentes.</p>
        )}
        {!isLoading &&
          results.map((docente) => (
            <Form.Check
              type="checkbox"
              key={docente.ID_USUARIO}
              id={`docente-${docente.ID_USUARIO}`}
              label={docente.NOMBRE_USUARIO}
              checked={selectedIds.includes(docente.ID_USUARIO)}
              onChange={() => handleCheckboxChange(docente.ID_USUARIO)}
            />
          ))}
      </div>
      <Form.Text>Seleccionados: {selectedIds.length}</Form.Text>
    </Form.Group>
  );
};

export default SearchableCheckboxList;
