import { rest } from 'msw';
import { mockExamenes, mockSecciones, mockEstados } from './mockData';

export const handlers = [
  rest.get('/api/examen', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockExamenes));
  }),

  rest.post('/api/examen', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ ...req.body, ID_EXAMEN: 999 }));
  }),

  rest.put('/api/examen/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ ...req.body, ID_EXAMEN: parseInt(req.params.id) })
    );
  }),

  rest.delete('/api/examen/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }));
  }),

  rest.get('/api/secciones', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockSecciones));
  }),

  rest.get('/api/estados', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockEstados));
  }),
];
