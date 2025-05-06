import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

function Modal({ title, children, onClose }) {
  return (
    <div
      className="modal show"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SeccionForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_SECCION || '');
  const [asignaturaId, setAsignaturaId] = useState(
    initial?.ASIGNATURA_ID_ASIGNATURA?.toString() || ''
  );
  const [asignatura, setAsignatura] = useState([]);

  useEffect(() => {
    const fetchAsignaturas = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/asignatura');
        const data = await response.json();
        setAsignatura(data);
      } catch (error) {
        console.error('Error al obtener las asignaturas:', error);
      }
    };

    fetchAsignaturas();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_seccion: nombre,
      asignatura_id_asignatura: parseInt(asignaturaId),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="nombre" className="form-label">
          Nombre de la Sección
        </label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Asignatura</label>
        <select
          className="form-control"
          value={asignaturaId}
          onChange={(e) => setAsignaturaId(e.target.value)}
          required
        >
          <option value="" key="default">
            Seleccione una asignatura
          </option>
          {asignatura.map((asignatura) => (
            <option
              key={`asignatura-${asignatura.ID_ASIGNATURA}`}
              value={asignatura.ID_ASIGNATURA}
            >
              {asignatura.NOMBRE_ASIGNATURA}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          Guardar
        </button>
      </div>
    </form>
  );
}

function AsignaturaForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_ASIGNATURA || '');
  const [carreraId, setCarreraId] = useState(
    initial?.CARRERA_ID_CARRERA?.toString() || ''
  );
  const [carrera, setCarrera] = useState([]);

  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/carrera');
        const data = await response.json();
        setCarrera(data);
      } catch (error) {
        console.error('Error al obtener las carreras:', error);
      }
    };
    fetchCarreras();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_asignatura: nombre,
      carrera_id_carrera: parseInt(carreraId),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="nombre" className="form-label">
          Nombre de la Asignatura
        </label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Carrera</label>
        <select
          className="form-control"
          value={carreraId}
          onChange={(e) => setCarreraId(e.target.value)}
          required
        >
          <option value="" key="default">
            Seleccione una carrera
          </option>
          {carrera.map((carrera) => (
            <option
              key={`carrera-${carrera.ID_CARRERA}`}
              value={carrera.ID_CARRERA}
            >
              {carrera.NOMBRE_CARRERA}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          Guardar
        </button>
      </div>
    </form>
  );
}

function CarreraForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_CARRERA || '');
  const [escuelaId, setEscuelaId] = useState(
    initial?.ESCUELA_ID_ESCUELA?.toString() || ''
  );
  const [escuelas, setEscuelas] = useState([]);

  useEffect(() => {
    const fetchEscuelas = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/escuela');
        const data = await response.json();
        setEscuelas(data);
      } catch (error) {
        console.error('Error al obtener las escuelas:', error);
      }
    };
    fetchEscuelas();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_carrera: nombre,
      escuela_id_escuela: parseInt(escuelaId),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Nombre de la Carrera</label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <label className="form-label">Escuela</label>
        <select
          className="form-select"
          value={escuelaId}
          onChange={(e) => setEscuelaId(e.target.value)}
          required
        >
          <option value="" key="default">
            Seleccione una Escuela
          </option>
          {escuelas.map((escuela) => (
            <option
              key={`escuela-${escuela.ID_ESCUELA}`}
              value={escuela.ID_ESCUELA}
            >
              {escuela.NOMBRE_ESCUELA}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          Guardar
        </button>
      </div>
    </form>
  );
}

function EscuelaForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_ESCUELA);
  const [sedeId, setSedeId] = useState(initial?.ID_SEDE?.toString());
  const [sedes, setSedes] = useState([]);

  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/sede');
        const data = await response.json();
        setSedes(data);
      } catch (error) {
        console.error('Error al obtener las sedes:', error);
      }
    };
    fetchSedes();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_escuela: nombre,
      sede_id_sede: parseInt(sedeId),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label"> Nombre de la Escuela </label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Sede</label>
        <select
          className="form-select"
          value={sedeId}
          onChange={(e) => setSedeId(e.target.value)}
          required
        >
          <option value="" key="default">
            Seleccione una sede
          </option>
          {sedes.map((sede) => (
            <option key={`sede-${sede.ID_SEDE}`} value={sede.ID_SEDE}>
              {sede.NOMBRE_SEDE}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          Guardar
        </button>
      </div>
    </form>
  );
}

export default function AsignaturasPage() {
  const [secciones, setSecciones] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [selectedSeccion, setSelectedSeccion] = useState(null);
  const [selectedAsignatura, setSelectedAsignatura] = useState(null);
  const [selectedCarrera, setSelectedCarrera] = useState(null);
  const [selectedEscuela, setSelectedEscuela] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ type: null, data: null });
  const [activeTab, setActiveTab] = useState('asignaturas');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [asignaturasRes, carrerasRes, escuelasRes, seccionesRes] =
        await Promise.all([
          fetch('http://localhost:3000/api/asignatura'),
          fetch('http://localhost:3000/api/carrera'),
          fetch('http://localhost:3000/api/escuela'),
          fetch('http://localhost:3000/api/seccion'),
        ]);

      const asignaturasData = await asignaturasRes.json();
      const carrerasData = await carrerasRes.json();
      const escuelasData = await escuelasRes.json();
      const seccionesData = await seccionesRes.json();

      setSecciones(seccionesData);
      setAsignaturas(asignaturasData);
      setCarreras(carrerasData);
      setEscuelas(escuelasData);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      setError(
        'Error al cargar los datos. Por favor, inténtalo de nuevo más tarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, entity) => {
    let data = null;
    if (type === 'edit' || type === 'delete') {
      switch (entity) {
        case 'asignatura':
          if (!selectedAsignatura) return;
          data = asignaturas.find(
            (a) => a.ID_ASIGNATURA === selectedAsignatura
          );
          break;
        case 'seccion':
          if (!selectedSeccion) return;
          data = secciones.find((s) => s.ID_SECCION === selectedSeccion);
          break;
        case 'carrera':
          if (!selectedCarrera) return;
          data = carreras.find((c) => c.ID_CARRERA === selectedCarrera);
          break;
        case 'escuela':
          if (!selectedEscuela) return;
          data = escuelas.find((e) => e.ID_ESCUELA === selectedEscuela);
          break;
      }
    }
    setModal({ type, entity, data });
  };

  const closeModal = () => setModal({ type: null, data: null });

  //Manejadores
  const handleAddAsignatura = async (form) => {
    try {
      const response = await fetch('http://localhost:3000/api/asignatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Error al agregar la asignatura');
      closeModal();
      loadData();
    } catch (error) {
      setError('Error al agregar la asignatura');
      closeModal();
    }
  };

  const handleEditAsignatura = async (form) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/asignatura/${selectedAsignatura}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      if (!response.ok) throw new Error('Error al editar la asignatura');
      closeModal();
      loadData();
    } catch (error) {
      setError('Error al editar la asignatura');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleDeleteAsignatura = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/asignatura/${selectedAsignatura}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) throw new Error('Error al eliminar la asignatura');
      closeModal();
      setSelectedAsignatura(null);
      loadData();
    } catch (error) {
      setError('Error al eliminar la asignatura');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleAddSeccion = async (form) => {
    try {
      const response = await fetch('http://localhost:3000/api/seccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Error al agregar la seccion');
      closeModal();
      loadData();
    } catch (error) {
      setError('Error al agregar la seccion');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleEditSeccion = async (form) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/seccion/${selectedSeccion}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      if (!response.ok) throw new Error('Error al editar la seccion');
      closeModal();
      loadData();
    } catch (error) {
      setError('Error al editar la seccion');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleDeleteSeccion = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/seccion/${selectedSeccion}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) throw new Error('Error al eliminar la seccion');
      closeModal();
      setSelectedSeccion(null);
      loadData();
    } catch (error) {
      setError('Error al eliminar la seccion');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleAddCarrera = async (form) => {
    try {
      const response = await fetch('http://localhost:3000/api/carrera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Error al agregar la carrera');
      loadData();
      closeModal();
    } catch (error) {
      console.error(error);
      closeModal();
    }
  };

  const handleEditCarrera = async (form) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/carrera/${selectedCarrera}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      if (!response.ok) throw new Error('Error al editar la carrera');
      closeModal();
      loadData();
    } catch (error) {
      setError('Error al editar la carrera');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleDeleteCarrera = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/carrera/${selectedCarrera}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) throw new Error('Error al eliminar la carrera');
      closeModal();
      setSelectedCarrera(null);
      loadData();
    } catch (error) {
      setError('Error al eliminar la carrera');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleAddEscuela = async (form) => {
    try {
      const response = await fetch('http://localhost:3000/api/escuela', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Error al agregar la escuela');
      closeModal();
      loadData();
    } catch (error) {
      setError('Error al agregar la escuela');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleEditEscuela = async (form) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/escuela/${selectedEscuela}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) throw new Error('Error al editar la escuela');
      closeModal();
      loadData();
    } catch (error) {
      setError('Error al editar la escuela');
      console.error('Error:', error);
      closeModal();
    }
  };

  const handleDeleteEscuela = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/escuela/${selectedEscuela}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) throw new Error('Error al eliminar la escuela');

      closeModal();
      setSelectedEscuela(null);
      loadData();
    } catch (error) {
      setError('Error al eliminar la escuela');
      console.error('Error:', error);
      closeModal();
    }
  };

  return (
    <Layout>
      <h1 className="mb-4">Administración de Asignaturas</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'asignaturas' ? 'active' : ''}`}
            onClick={() => setActiveTab('asignaturas')}
          >
            Asignaturas
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'secciones' ? 'active' : ''}`}
            onClick={() => setActiveTab('secciones')}
          >
            Secciones
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'carreras' ? 'active' : ''}`}
            onClick={() => setActiveTab('carreras')}
          >
            Carreras
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'escuelas' ? 'active' : ''}`}
            onClick={() => setActiveTab('escuelas')}
          >
            Escuelas
          </button>
        </li>
      </ul>

      {activeTab === 'asignaturas' && (
        <>
          <div className="mb-3">
            <button
              className="btn btn-success me-2"
              onClick={() => openModal('add', 'asignatura')}
            >
              Agregar Asignatura
            </button>
            <button
              className="btn btn-warning me-2"
              onClick={() => openModal('edit', 'asignatura')}
              disabled={!selectedAsignatura}
            >
              Modificar Asignatura
            </button>
            <button
              className="btn btn-danger"
              onClick={() => openModal('delete', 'asignatura')}
              disabled={!selectedAsignatura}
            >
              Eliminar Asignatura
            </button>
          </div>

          {loading ? (
            <div> Cargando ... </div>
          ) : (
            <table className="table table-bordered">
              <thead className="table-ligth">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Carrera</th>
                </tr>
              </thead>
              <tbody>
                {asignaturas.map((a) => (
                  <tr
                    key={`sala-${a.ID_ASIGNATURA}`}
                    onClick={() =>
                      a.ID_ASIGNATURA && setSelectedAsignatura(a.ID_ASIGNATURA)
                    }
                    className={
                      a.ID_ASIGNATURA === selectedAsignatura
                        ? 'table-primary'
                        : ''
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{a.ID_ASIGNATURA || 'N/A'}</td>
                    <td>{a.NOMBRE_ASIGNATURA || 'N/A'}</td>
                    <td>{a.NOMBRE_CARRERA || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {activeTab === 'secciones' && (
        <>
          <div className="mb-3">
            <button
              className="btn btn-success me-2"
              onClick={() => openModal('add', 'seccion')}
            >
              Agregar Seccion
            </button>
            <button
              className="btn btn-warning me-2"
              onClick={() => openModal('edit', 'seccion')}
              disabled={!selectedSeccion}
            >
              Modificar Seccion
            </button>
            <button
              className="btn btn-danger"
              onClick={() => openModal('delete', 'seccion')}
              disabled={!selectedSeccion}
            >
              Eliminar Seccion
            </button>
          </div>

          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Asignatura</th>
                <th>Profesor</th>
                <th>Carrera</th>
              </tr>
            </thead>
            <tbody>
              {secciones.map((s) => (
                <tr
                  key={`seccion-${s.ID_SECCION}`}
                  onClick={() => setSelectedSeccion(s.ID_SECCION)}
                  className={
                    s.ID_SECCION === selectedSeccion ? 'table-primary' : ''
                  }
                  style={{ cursor: 'pointer' }}
                >
                  <td>{s.ID_SECCION || 'N/A'}</td>
                  <td>{s.NOMBRE_SECCION || 'N/A'}</td>
                  <td>{s.ASIGNATURA_ID_ASIGNATURA || 'N/A'}</td>
                  <td>{s.PROFESOR_ID_PROFESOR || 'N/A'}</td>
                  <td>{s.CARRERA_ID_CARRERA || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {activeTab === 'carreras' && (
        <>
          <div className="mb-3">
            <button
              className="btn btn-success me-2"
              onClick={() => openModal('add', 'carrera')}
            >
              Agregar Carrera
            </button>
            <button
              className="btn btn-warning me-2"
              onClick={() => openModal('edit', 'carrera')}
              disabled={!selectedCarrera}
            >
              Modificar Carrera
            </button>
            <button
              className="btn btn-danger"
              onClick={() => openModal('delete', 'carrera')}
              disabled={!selectedCarrera}
            >
              Eliminar Carrera
            </button>
          </div>

          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Escuela</th>
              </tr>
            </thead>
            <tbody>
              {carreras.map((c) => (
                <tr
                  key={`carrera-${c.ID_CARRERA}`}
                  onClick={() => setSelectedCarrera(c.ID_CARRERA)}
                  className={
                    c.ID_CARRERA === selectedCarrera ? 'table-primary' : ''
                  }
                  style={{ cursor: 'pointer' }}
                >
                  <td>{c.ID_CARRERA || 'N/A'}</td>
                  <td>{c.NOMBRE_CARRERA || 'N/A'}</td>
                  <td>{c.NOMBRE_ESCUELA || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {activeTab === 'escuelas' && (
        <>
          <div className="mb-3">
            <button
              className="btn btn-success me-2"
              onClick={() => openModal('add', 'escuela')}
            >
              Agregar Escuela
            </button>
            <button
              className="btn btn-warning me-2"
              onClick={() => openModal('edit', 'escuela')}
              disabled={!selectedEscuela}
            >
              Modificar Escuela
            </button>
            <button
              className="btn btn-danger"
              onClick={() => openModal('delete', 'escuela')}
              disabled={!selectedEscuela}
            >
              Eliminar Escuela
            </button>
          </div>

          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Sede</th>
              </tr>
            </thead>
            <tbody>
              {escuelas.map((e) => (
                <tr
                  key={`escuela-${e.ID_ESCUELA}`}
                  onClick={() => setSelectedEscuela(e.ID_ESCUELA)}
                  className={
                    e.ID_ESCUELA === selectedEscuela ? 'table-primary' : ''
                  }
                  style={{ cursor: 'pointer' }}
                >
                  <td>{e.ID_ESCUELA || 'N/A'}</td>
                  <td>{e.NOMBRE_ESCUELA || 'N/A'}</td>
                  <td>{e.NOMBRE_SEDE || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Modales */}

      {modal.type === 'add' && modal.entity === 'asignatura' && (
        <Modal title="Agregar Asignatura" onClose={closeModal}>
          <AsignaturaForm
            onSubmit={handleAddAsignatura}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal.type === 'edit' && modal.entity === 'asignatura' && (
        <Modal title="Editar Asignatura" onClose={closeModal}>
          <AsignaturaForm
            onSubmit={handleEditAsignatura}
            initial={modal.data}
            onClose={closeModal}
          />
        </Modal>
      )}

      {modal.type === 'delete' && modal.entity === 'asignatura' && (
        <Modal title="Eliminar Asignatura" onClose={closeModal}>
          <div className="modal-body">
            <p>¿Esta seguro de que desea eliminar esta asignatura?</p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteAsignatura}
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal.type === 'add' && modal.entity === 'seccion' && (
        <Modal title="Agregar Seccion" onClose={closeModal}>
          <SeccionForm onSubmit={handleAddSeccion} onCancel={closeModal} />
        </Modal>
      )}

      {modal.type === 'edit' && modal.entity === 'seccion' && (
        <Modal title="Editar Seccion" onClose={closeModal}>
          <SeccionForm
            onSubmit={handleEditSeccion}
            initial={modal.data}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal.type === 'delete' && modal.entity === 'seccion' && (
        <Modal title="Eliminar Seccion" onClose={closeModal}>
          <div className="modal-body">
            <p>¿Esta seguro de que desea eliminar esta seccion?</p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteSeccion}
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal.type === 'add' && modal.entity === 'carrera' && (
        <Modal title="Agregar Carrera" onClose={closeModal}>
          <CarreraForm onSubmit={handleAddCarrera} onCancel={closeModal} />
        </Modal>
      )}

      {modal.type === 'edit' && modal.entity === 'carrera' && (
        <Modal title="Editar Carrera" onClose={closeModal}>
          <CarreraForm
            initial={modal.data}
            onSubmit={handleEditCarrera}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal.type === 'delete' && modal.entity === 'carrera' && (
        <Modal title="Eliminar Carrera" onClose={closeModal}>
          <div className="modal-body">
            <p>¿Esta seguro de que desea eliminar esta carrera?</p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteCarrera}
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal.type === 'add' && modal.entity === 'escuela' && (
        <Modal title="Agregar Escuela" onClose={closeModal}>
          <EscuelaForm onSubmit={handleAddEscuela} onCancel={closeModal} />
        </Modal>
      )}

      {modal.type === 'edit' && modal.entity === 'escuela' && (
        <Modal title="Editar Escuela" onClose={closeModal}>
          <EscuelaForm
            onSubmit={handleEditEscuela}
            initial={modal.data}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal.type === 'delete' && modal.entity === 'escuela' && (
        <Modal title="Eliminar Escuela" onClose={closeModal}>
          <div className="modal-body">
            <p>¿Esta seguro de que desea eliminar esta escuela?</p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteEscuela}
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
