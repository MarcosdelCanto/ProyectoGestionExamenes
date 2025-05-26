import api from './api'; // tu instancia de Axios o fetch wrapper

export function fetchAllRoles() {
  return api.get('/roles'); // ajusta la URL según tu backend
}
