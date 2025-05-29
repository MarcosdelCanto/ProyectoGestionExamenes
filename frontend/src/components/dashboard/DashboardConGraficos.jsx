import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = [
  '#0d6efd',
  '#198754',
  '#ffc107',
  '#dc3545',
  '#6f42c1',
  '#fd7e14',
]; // Colores de Bootstrap, añadí más por si acaso

const dataCarreras = [
  { name: 'Ingeniería Informática', value: 14 }, // Nombre un poco más largo para probar
  { name: 'Administración de Empresas', value: 9 }, // Nombre un poco más largo para probar
  { name: 'Construcción Civil', value: 6 },
  { name: 'Diseño Gráfico', value: 3 },
];

const dataModulos = [
  { hora: '08:00', cantidad: 5 },
  { hora: '10:00', cantidad: 12 },
  { hora: '12:00', cantidad: 9 },
  { hora: '14:00', cantidad: 6 },
];

const dataSalas = [
  { name: 'Ocupadas', value: 12 },
  { name: 'Disponibles', value: 8 },
];

const dataExamenesPorDia = [
  { dia: 'Lunes', examenes: 6 },
  { dia: 'Martes', examenes: 10 },
  { dia: 'Miércoles', examenes: 8 },
  { dia: 'Jueves', examenes: 9 },
  { dia: 'Viernes', examenes: 5 },
];

const DashboardConGraficos = () => {
  return (
    <div className="row g-3 g-md-4 p-3 p-md-4">
      {/* Gráfico de Exámenes por Carrera */}
      <div className="col-12 col-md-6 mb-4">
        <div className="card shadow h-100">
          {/* Quitado align-items-center para que flex-grow-1 pueda expandirse bien */}
          <div className="card-body d-flex flex-column">
            <h5 className="card-title fw-semibold mb-3">
              Exámenes por Carrera
            </h5>
            {/* Aplicar una altura mínima/fija al contenedor del gráfico */}
            <div className="flex-grow-1" style={{ minHeight: '300px' }}>
              {' '}
              {/* Ajusta esta altura según necesites */}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataCarreras}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Módulos más agendados */}
      <div className="col-12 col-md-6 mb-4">
        <div className="card shadow h-100">
          {/* Quitado align-items-center para que flex-grow-1 pueda expandirse bien */}
          <div className="card-body d-flex flex-column">
            <h5 className="card-title fw-semibold mb-3">
              Módulos más Agendados
            </h5>
            {/* Aplicar una altura mínima/fija al contenedor del gráfico */}
            <div className="flex-grow-1" style={{ minHeight: '300px' }}>
              {' '}
              {/* Ajusta esta altura según necesites */}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dataModulos}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="cantidad"
                    stroke={COLORS[1]}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Distribución de Salas */}
      <div className="col-12 col-md-6 mb-4">
        <div className="card shadow h-100">
          <div className="card-body d-flex flex-column align-items-center">
            <h5 className="card-title fw-semibold mb-3">Uso de Salas</h5>
            <div
              className="flex-grow-1"
              style={{ width: '100%', height: '300px' }} // Ajusta esta altura si es necesario
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataSalas}
                    cx="50%"
                    cy="50%"
                    outerRadius={80} // Puedes aumentar esto si hay más espacio
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {dataSalas.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Exámenes por Día */}
      <div className="col-12 col-md-6 mb-4">
        <div className="card shadow h-100">
          <div className="card-body d-flex flex-column">
            <h5 className="card-title fw-semibold mb-3">Exámenes por Día</h5>
            {/* Aplicar una altura mínima/fija al contenedor del gráfico */}
            <div className="flex-grow-1" style={{ minHeight: '300px' }}>
              {' '}
              {/* Ajusta esta altura según necesites */}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataExamenesPorDia}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="dia"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="examenes" fill={COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardConGraficos;
