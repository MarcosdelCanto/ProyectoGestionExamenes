import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExamenActions from '../../../components/examenes/ExamenActions';
import { mockExamenes } from '../../mocks/mockData';

describe('ExamenActions Component', () => {
  const mockOnAdd = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  it('renders all buttons', () => {
    render(
      <ExamenActions
        onAdd={mockOnAdd}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        selectedExamenes={[]}
        disabled={false}
      />
    );

    expect(screen.getByText('Agregar Examen')).toBeInTheDocument();
    expect(screen.getByText('Modificar Examen')).toBeInTheDocument();
    expect(screen.getByText('Eliminar Examen')).toBeInTheDocument();
  });

  it('disables all buttons when disabled prop is true', () => {
    render(
      <ExamenActions
        onAdd={mockOnAdd}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        selectedExamenes={[]}
        disabled={true}
      />
    );

    expect(screen.getByText('Agregar Examen').closest('button')).toBeDisabled();
    expect(
      screen.getByText('Modificar Examen').closest('button')
    ).toBeDisabled();
    expect(
      screen.getByText('Eliminar Examen').closest('button')
    ).toBeDisabled();
  });

  it('enables edit button when exactly one examen is selected', () => {
    render(
      <ExamenActions
        onAdd={mockOnAdd}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        selectedExamenes={[mockExamenes[0]]}
        disabled={false}
      />
    );

    expect(
      screen.getByText('Modificar Examen').closest('button')
    ).not.toBeDisabled();
  });

  it('disables edit button when multiple examenes are selected', () => {
    render(
      <ExamenActions
        onAdd={mockOnAdd}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        selectedExamenes={mockExamenes}
        disabled={false}
      />
    );

    expect(
      screen.getByText('Modificar Examen').closest('button')
    ).toBeDisabled();
  });

  it('enables delete button when at least one examen is selected', () => {
    render(
      <ExamenActions
        onAdd={mockOnAdd}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        selectedExamenes={[mockExamenes[0]]}
        disabled={false}
      />
    );

    expect(
      screen.getByText('Eliminar Examen').closest('button')
    ).not.toBeDisabled();
  });

  it('calls onAdd when add button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ExamenActions
        onAdd={mockOnAdd}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        selectedExamenes={[]}
        disabled={false}
      />
    );

    await user.click(screen.getByText('Agregar Examen'));
    expect(mockOnAdd).toHaveBeenCalled();
  });
});
