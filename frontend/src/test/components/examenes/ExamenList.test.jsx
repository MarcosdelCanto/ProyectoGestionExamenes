import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExamenList from '../../../components/examenes/ExamenList';
import { mockExamenes } from '../../mocks/mockData';

describe('ExamenList Component', () => {
  const mockToggleExamenSelection = vi.fn();
  const mockToggleSelectAllExamenes = vi.fn();

  it('renders without crashing', () => {
    render(
      <ExamenList
        examenes={mockExamenes}
        selectedExamenes={[]}
        onToggleExamenSelection={mockToggleExamenSelection}
        onToggleSelectAllExamenes={mockToggleSelectAllExamenes}
        loading={false}
      />
    );

    expect(screen.getByText('Examen de Programación')).toBeInTheDocument();
    expect(screen.getByText('Examen de Bases de Datos')).toBeInTheDocument();
  });

  it('displays loading message when loading is true and no examenes', () => {
    render(
      <ExamenList
        examenes={[]}
        selectedExamenes={[]}
        onToggleExamenSelection={mockToggleExamenSelection}
        onToggleSelectAllExamenes={mockToggleSelectAllExamenes}
        loading={true}
      />
    );

    expect(screen.getByText('Cargando exámenes...')).toBeInTheDocument();
  });

  it('displays no examenes message when there are no examenes and not loading', () => {
    render(
      <ExamenList
        examenes={[]}
        selectedExamenes={[]}
        onToggleExamenSelection={mockToggleExamenSelection}
        onToggleSelectAllExamenes={mockToggleSelectAllExamenes}
        loading={false}
      />
    );

    expect(
      screen.getByText('No hay exámenes para mostrar.')
    ).toBeInTheDocument();
  });

  it('calls onToggleExamenSelection when checkbox is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ExamenList
        examenes={mockExamenes}
        selectedExamenes={[]}
        onToggleExamenSelection={mockToggleExamenSelection}
        onToggleSelectAllExamenes={mockToggleSelectAllExamenes}
        loading={false}
      />
    );

    const checkbox = screen.getAllByRole('checkbox')[1]; // First examen checkbox
    await user.click(checkbox);

    expect(mockToggleExamenSelection).toHaveBeenCalledWith(mockExamenes[0]);
  });

  it('calls onToggleSelectAllExamenes when select all checkbox is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ExamenList
        examenes={mockExamenes}
        selectedExamenes={[]}
        onToggleExamenSelection={mockToggleExamenSelection}
        onToggleSelectAllExamenes={mockToggleSelectAllExamenes}
        loading={false}
      />
    );

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0]; // Select all checkbox
    await user.click(selectAllCheckbox);

    expect(mockToggleSelectAllExamenes).toHaveBeenCalled();
  });
});
