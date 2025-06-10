import api from './api';

export const fetchAllExamenes = async () => {
  try {
    // Ajusta este endpoint si tienes uno específico para listar exámenes para selección
    const response = await api.get('/examenes');
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching todos los exámenes:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

export const fetchUserActiveExams = async () => {
  const endpoint = '/api/examen/examenes/disponibles'; // Verifica que esta sea la URL correcta
  console.log(`[examenService] Solicitando exámenes desde: ${endpoint}`);
  try {
    // Si usas apiClient o axios:
    const response = await api.get('/examen/examenes/disponibles');
    // Si usas fetch:
    // const rawResponse = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${tuToken}` /* si es necesario */ } });
    // if (!rawResponse.ok) throw new Error(`Error del servidor: ${rawResponse.status}`);
    // const response = await rawResponse.json(); // O response.data si es axios

    console.log('[examenService] Respuesta recibida del backend:', response);

    // Si usas axios, la data usualmente está en response.data
    // Si usas fetch y .json(), la data es la 'response' directamente.
    const dataToReturn = response.data || response; // Ajusta según cómo obtengas la data

    console.log(
      '[examenService] Datos a retornar al componente:',
      dataToReturn
    );
    return dataToReturn;
  } catch (error) {
    console.error(
      '[examenService] Error al obtener los exámenes disponibles:',
      error.response?.data || error.message,
      error
    );
    throw error; // Re-lanza el error para que el componente lo maneje
  }
};

/**
 * NUEVA FUNCIÓN: Obtiene los exámenes optimizados para un selector/dropdown.
 */
export const fetchAllExamenesForSelect = async () => {
  try {
    // Llama a la NUEVA ruta GET /api/examen/para-selector
    const response = await api.get('/examen/para-selector');
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching exámenes para selector:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

export const fetchExamenById = (id) => api.get(`/examen/${id}`);
export const createExamen = (data) => api.post('/examen', data);
export const updateExamen = (id, data) => api.put(`/examen/${id}`, data);
export const deleteExamen = (id) => api.delete(`/examen/${id}`);

export const AddExamen = async (form) => {
  const response = await api.post('/examen', form);
  if (!response.data) throw new Error('Error al crear examen');
  return response.data;
};
export const EditEdificio = async (selectedExamen, form) => {
  const response = await api.put(`/examen/${selectedExamen}`, form);
  if (!response.data) throw new Error('Error al editar examen');
  return response.data;
};
export const DeleteEdificio = async (selecteExamen) => {
  const response = await api.delete(`/examen/${selecteExamen}`);
  if (!response.data) throw new Error('Error al eliminar examen');
  return response.data;
};
