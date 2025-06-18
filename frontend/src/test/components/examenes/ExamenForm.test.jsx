import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExamenForm from '../../../components/examenes/ExamenForm';
import { mockSecciones, mockEstados } from '../../mocks/mockData';

// Mock de servicios
vi.mock('../../../services/seccionService', () => ({
  fetchAllSecciones: vi.fn().mockResolvedValue(mockSecciones),
}));

vi.mock('../../../services/estadoService', () => ({
  fetchAllEstados: vi.fn().mockResolvedValue(mockEstados),
}));

// Mock de react-select
vi.mock('react-select', () => ({
  default: ({ options, value, onChange, placeholder, isDisabled, name }) => {
    function handleChange(event) {
      const option = options.find(
        (option) => option.value === event.currentTarget.value
      );
      onChange(option ? option.value : '');
    }

    return (
      <select
        data-testid={placeholder || name}
        value={value}
        onChange={handleChange}
        disabled={isDisabled}
        name={name}
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

describe('ExamenForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with empty values when adding a new examen', async () => {
    render(<ExamenForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre del Examen')).toHaveValue('');
      expect(screen.getByLabelText('Cantidad de Inscritos')).toHaveValue('');
    });
  });

  it('renders the form with prefilled values when editing an examen', async () => {
    const examenToEdit = {
      ID_EXAMEN: 1,
      NOMBRE_EXAMEN: 'Examen de Prueba',
      INSCRITOS_EXAMEN: 20,
      TIPO_PROCESAMIENTO_EXAMEN: 'MANUAL',
      PLATAFORMA_PROSE_EXAMEN: 'CANVAS',
      SITUACION_EVALUATIVA_EXAMEN: 'Parcial',
      CANTIDAD_MODULOS_EXAMEN: 2,
      SECCION_ID_SECCION: 1,
      ESTADO_ID_EXAMEN: 1,
    };

    render(
      <ExamenForm
        initial={examenToEdit}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre del Examen')).toHaveValue(
        'Examen de Prueba'
      );
      expect(screen.getByLabelText('Cantidad de Inscritos')).toHaveValue('20');
    });
  });

  it('submits the form with correct values', async () => {
    const user = userEvent.setup();

    render(<ExamenForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre del Examen')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Nombre del Examen'), 'Nuevo Examen');
    await user.type(screen.getByLabelText('Cantidad de Inscritos'), '30');
    await user.type(screen.getByLabelText('Tipo de Procesamiento'), 'MANUAL');
    await user.type(
      screen.getByLabelText('Plataforma de Procesamiento'),
      'CANVAS'
    );
    await user.type(screen.getByLabelText('Situación Evaluativa'), 'Final');
    await user.type(screen.getByLabelText('Cantidad de Módulos'), '3');

    // Seleccionar sección y estado
    const seccionSelect = screen.getByTestId('Sección');
    await user.selectOptions(seccionSelect, '1');

    const estadoSelect = screen.getByTestId('Estado');
    await user.selectOptions(estadoSelect, '1');

    // Submit form
    await user.click(screen.getByText('Guardar'));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre_examen: 'Nuevo Examen',
        inscritos_examen: 30,
        tipo_procesamiento_examen: 'MANUAL',
        plataforma_prose_examen: 'CANVAS',
        situacion_evaluativa_examen: 'Final',
        cantidad_modulos_examen: 3,
        seccion_id_seccion: '1',
        estado_id_examen: '1',
      })
    );
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(<ExamenForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.click(screen.getByText('Cancelar'));

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
