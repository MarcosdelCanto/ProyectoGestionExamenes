import api from './api';

/**
 * Obtiene todas las asignaturas asociadas a una carrera específica.
 * Usado para los filtros dependientes en el dashboard.
 * @param {string|number} carreraId - El ID de la carrera.
 * @returns {Promise<Array<Object>>} - Un array de asignaturas.
 */
export const fetchAsignaturasByCarrera = async (carreraId) => {
  try {
    const response = await api.get(`/asignatura/carrera/${carreraId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching asignaturas for carrera ${carreraId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// git add
// export const fetchAllAsignaturas = () => api.get('/asignatura'); // Anterior
export const fetchAllAsignaturas = async () => {
  try {
    const response = await api.get('/asignatura');
    return response.data; // Asumiendo que response.data es el array de asignaturas
  } catch (error) {
    console.error('Error fetching asignaturas:', error);
    throw error; // Propagar el error para que el componente lo maneje
  }
};
export const fetchAsignaturaById = async (id) => {
  try {
    const response = await api.get(`/asignatura/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching asignatura with id ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};
export const createAsignatura = async (data) => {
  try {
    const response = await api.post('/asignatura', data);
    return response.data;
  } catch (error) {
    console.error(
      'Error creating asignatura:',
      error.response?.data || error.message
    );
    throw error;
  }
};
export const updateAsignatura = async (id, data) => {
  try {
    const response = await api.put(`/asignatura/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating asignatura ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};
export const deleteAsignatura = async (id) => {
  try {
    const response = await api.delete(`/asignatura/${id}`);
    return response.data; // O un mensaje de éxito si el backend no devuelve el objeto eliminado
  } catch (error) {
    console.error(
      `Error deleting asignatura ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};
