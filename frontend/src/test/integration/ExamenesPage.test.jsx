import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import ExamenesPage from '../../pages/ExamenesPage';
import { mockExamenes } from '../mocks/mockData';

// Configuración del servidor mock con MSW para Vitest
const restHandlers = [
  rest.get('/api/examen', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockExamenes));
  }),

  rest.get('/api/secciones', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([]));
  }),

  rest.get('/api/estados', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([]));
  }),
];

const server = setupServer(...restHandlers);

// Configuramos Layout para simplificar la prueba
vi.mock('../../components/Layout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

describe('ExamenesPage Integration', () => {
  // Configurar servidor antes de todas las pruebas
  beforeAll(() => server.listen());

  // Resetear handlers entre pruebas
  afterEach(() => server.resetHandlers());

  // Cerrar servidor después de todas las pruebas
  afterAll(() => server.close());

  it('loads and displays exámenes', async () => {
    render(<ExamenesPage />);

    // Esperar a que se carguen los exámenes
    await waitFor(() => {
      expect(screen.getByText('Examen de Programación')).toBeInTheDocument();
      expect(screen.getByText('Examen de Bases de Datos')).toBeInTheDocument();
    });
  });

  it('allows filtering exámenes', async () => {
    const user = userEvent.setup();
    render(<ExamenesPage />);

    // Esperar a que se carguen los exámenes
    await waitFor(() => {
      expect(screen.getByText('Examen de Programación')).toBeInTheDocument();
    });

    // Aplicar filtro de texto
    const searchInput = screen.getByPlaceholderText('Buscar por nombre...');
    await user.type(searchInput, 'Bases');

    // Verificar que solo aparece el examen de Bases de Datos
    expect(
      screen.queryByText('Examen de Programación')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Examen de Bases de Datos')).toBeInTheDocument();
  });

  it('shows modal when adding a new examen', async () => {
    const user = userEvent.setup();
    render(<ExamenesPage />);

    // Esperar a que se cargue la página
    await waitFor(() => {
      expect(screen.getByText('Agregar Examen')).toBeInTheDocument();
    });

    // Clic en botón agregar
    await user.click(screen.getByText('Agregar Examen'));

    // Verificar que se muestra el modal
    expect(screen.getByText('Agregar Nuevo Examen')).toBeInTheDocument();
  });
});
