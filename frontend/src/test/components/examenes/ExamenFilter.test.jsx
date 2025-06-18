import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExamenFilter from '../../../components/examenes/ExamenFilter';
import {
  mockEscuelas,
  mockCarreras,
  mockAsignaturas,
  mockSecciones,
} from '../../mocks/mockData';

// Mock de react-select debido a su complejidad en testing
vi.mock('react-select', () => ({
  default: ({ options, value, onChange, placeholder, isDisabled }) => {
    function handleChange(event) {
      const option = options.find(
        (option) => option.value === event.currentTarget.value
      );
      onChange(option.value);
    }

    return (
      <select
        data-testid={placeholder}
        value={value}
        onChange={handleChange}
        disabled={isDisabled}
      >
        <option value="">Seleccionar...</option>
        {options.map(({ label, value }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    );
  },
}));

describe('ExamenFilter Component', () => {
  const mockOnFilterChange = vi.fn();
  const currentFilters = {
    escuela: '',
    carrera: '',
    asignatura: '',
    seccion: '',
    estado: '',
    text: '',
  };

  it('renders all filter dropdowns', () => {
    render(
      <ExamenFilter
        escuelas={mockEscuelas}
        carreras={mockCarreras}
        asignaturas={mockAsignaturas}
        secciones={mockSecciones}
        estados={[
          { value: '', label: 'Todos los estados' },
          { value: 'ACTIVO', label: 'ACTIVO' },
        ]}
        onFilterChange={mockOnFilterChange}
        currentFilters={currentFilters}
      />
    );

    expect(screen.getByTestId('Seleccione Escuela')).toBeInTheDocument();
    expect(screen.getByTestId('Seleccione Carrera')).toBeInTheDocument();
    expect(screen.getByTestId('Seleccione Asignatura')).toBeInTheDocument();
    expect(screen.getByTestId('Seleccione Sección')).toBeInTheDocument();
    expect(screen.getByTestId('Seleccione Estado')).toBeInTheDocument();
  });

  it('calls onFilterChange when a filter value changes', async () => {
    const user = userEvent.setup();

    render(
      <ExamenFilter
        escuelas={mockEscuelas}
        carreras={mockCarreras}
        asignaturas={mockAsignaturas}
        secciones={mockSecciones}
        estados={[
          { value: '', label: 'Todos los estados' },
          { value: 'ACTIVO', label: 'ACTIVO' },
        ]}
        onFilterChange={mockOnFilterChange}
        currentFilters={currentFilters}
      />
    );

    const escuelaSelect = screen.getByTestId('Seleccione Escuela');
    await user.selectOptions(escuelaSelect, '1');

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        escuela: '1',
      })
    );
  });
});
