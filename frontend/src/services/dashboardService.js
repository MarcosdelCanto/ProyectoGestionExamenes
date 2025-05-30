import api from './api'; // Asume que api.js está configurado correctamente

export const getDashboardSummary = () => {
  return api.get('/dashboard/summary');
};

export const getExamenesPorCarreraData = (filters = {}) => {
  return api.get('/dashboard/charts/examenes-por-carrera', { params: filters });
};

export const getModulosAgendadosData = (filters = {}) => {
  return api.get('/dashboard/charts/modulos-agendados', { params: filters });
};

export const getUsoSalasData = (filters = {}) => {
  return api.get('/dashboard/charts/uso-salas', { params: filters });
};

export const getExamenesPorDiaData = (filters = {}) => {
  return api.get('/dashboard/charts/examenes-por-dia', { params: filters });
};
