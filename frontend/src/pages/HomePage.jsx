import React from 'react';
import { fetchWithAuth } from '../services/api';

export default function HomePage() {
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    fetchWithAuth('/api/user/profile')
      .then((res) => res.json())
      .then((data) => setPerfil(data.perfil))
      .catch(console.error);
  }, []);

  if (!perfil) return <p>Cargando perfil…</p>;

  return (
    <div>
      <h1>Bienvenido, {perfil.NOMBRE}</h1>
      <p>Tu rol es: {perfil.ROL_ID_ROL}</p>
      {/* resto del home */}
    </div>
  );
}
