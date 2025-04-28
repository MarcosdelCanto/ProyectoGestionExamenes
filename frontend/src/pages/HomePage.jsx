import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../services/api';
import Layout from '../components/Layout';

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
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">
          Bienvenido, {perfil.NOMBRE_USUARIO}
        </h1>
        <p className="text-lg">Tu rol es: {perfil.ROL_ID_ROL}</p>
        {/* Aquí puedes agregar más contenido relacionado con el perfil */}
      </div>
    </Layout>
  );
}
