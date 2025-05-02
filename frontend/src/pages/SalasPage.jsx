import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

// Componente Modal Bootstrap
function Modal({ title, children, onClose }) {
  return (
    <div
      className="modal show"
      tabIndex="-1"
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

// Formulario dentro del modal para Agregar/Editar
// En la función SalaForm
function SalaForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_SALA || '');
  const [capacidad, setCapacidad] = useState(initial?.CAPACIDAD_SALA || '');
  const [edificioId, setEdificioId] = useState(
    initial?.EDIFICIO_ID_EDIFICIO?.toString() || ''
  );
  const [edificios, setEdificios] = useState([]);

  useEffect(() => {
    // Cargar la lista de edificios cuando el componente se monte
    const fetchEdificios = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/edificio');
        const data = await response.json();
        setEdificios(data);
      } catch (error) {
        console.error('Error al cargar edificios:', error);
      }
    };
    fetchEdificios();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_sala: nombre,
      capacidad_sala: parseInt(capacidad),
      edificio_id_edificio: parseInt(edificioId),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Nombre de la Sala</label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Capacidad</label>
        <input
          type="number"
          className="form-control"
          value={capacidad}
          onChange={(e) => setCapacidad(e.target.value)}
          min="1"
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Edificio</label>
        <select
          className="form-select"
          value={edificioId}
          onChange={(e) => setEdificioId(e.target.value)}
          required
        >
          <option value="" key="default">
            Seleccione un edificio
          </option>
          {edificios.map((edificio) => (
            <option
              key={`edificio-${edificio.ID_EDIFICIO}`}
              value={edificio.ID_EDIFICIO}
            >
              {edificio.SIGLA_EDIFICIO} - {edificio.NOMBRE_EDIFICIO}
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

// Formulario para Sedes
function SedeForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_SEDE || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_sede: nombre,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Nombre de la Sede</label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
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

// Formulario para Edificios
function EdificioForm({ initial, onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(initial?.NOMBRE_EDIFICIO || '');
  const [sigla, setSigla] = useState(initial?.SIGLA_EDIFICIO || '');
  const [sedeId, setSedeId] = useState(initial?.SEDE_ID_SEDE || '');
  const [sedes, setSedes] = useState([]);

  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/sede');
        const data = await response.json();
        setSedes(data);
      } catch (error) {
        console.error('Error al cargar sedes:', error);
      }
    };
    fetchSedes();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre_edificio: nombre,
      sigla_edificio: sigla,
      sede_id_sede: parseInt(sedeId),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Nombre del Edificio</label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Sigla</label>
        <input
          type="text"
          className="form-control"
          value={sigla}
          onChange={(e) => setSigla(e.target.value)}
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
          <option value="">Seleccione una sede</option>
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

export default function SalasPage() {
  const [salas, setSalas] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [selectedSala, setSelectedSala] = useState(null);
  const [selectedEdificio, setSelectedEdificio] = useState(null);
  const [selectedSede, setSelectedSede] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ type: null, data: null });
  const [activeTab, setActiveTab] = useState('salas');

  // Efectos
  useEffect(() => {
    loadSalas();
    loadSedesYEdificios();
  }, []);

  // Funciones de carga
  const loadSalas = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/sala');
      const data = await response.json();
      setSalas(data);
      setError('');
    } catch (error) {
      setError('Error cargando salas');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSedesYEdificios = async () => {
    try {
      const [sedesRes, edificiosRes] = await Promise.all([
        fetch('http://localhost:3000/api/sede'),
        fetch('http://localhost:3000/api/edificio'),
      ]);
      const sedesData = await sedesRes.json();
      const edificiosData = await edificiosRes.json();
      setSedes(sedesData);
      setEdificios(edificiosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar datos de sedes y edificios');
    }
  };

  // Funciones de modal
  const openModal = (type, entity) => {
    let data = null;
    if (type === 'edit' || type === 'delete') {
      switch (entity) {
        case 'sala':
          if (!selectedSala) return;
          data = salas.find((s) => s.ID_SALA === selectedSala);
          break;
        case 'edificio':
          if (!selectedEdificio) return;
          data = edificios.find((e) => e.ID_EDIFICIO === selectedEdificio);
          break;
        case 'sede':
          if (!selectedSede) return;
          data = sedes.find((s) => s.ID_SEDE === selectedSede);
          break;
      }
    }
    setModal({ type, entity, data });
  };

  const closeModal = () => setModal({ type: null, data: null });

  // Manejadores para salas
  const handleAdd = async (form) => {
    try {
      const response = await fetch('http://localhost:3000/api/sala', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Error al crear sala');
      closeModal();
      loadSalas();
    } catch (error) {
      setError('Error al crear sala');
    }
  };

  const handleEdit = async (form) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/sala/${selectedSala}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      );
      if (!response.ok) throw new Error('Error al actualizar sala');
      closeModal();
      loadSalas();
    } catch (error) {
      setError('Error al actualizar sala');
      console.error('Error:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/sala/${selectedSala}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) throw new Error('Error al eliminar sala');
      closeModal();
      setSelectedSala(null); // Changed from setSelected to setSelectedSala
      loadSalas();
    } catch (error) {
      setError('Error al eliminar sala');
      console.error('Error:', error);
    }
  };

  // Manejadores para edificios

  const handleAddEdificio = async (form) => {
    try {
      const response = await fetch('http://localhost:3000/api/edificio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear edificio');
      }

      closeModal();
      loadSedesYEdificios();
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al crear edificio');
    }
  };

  const handleEditEdificio = async (form) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/edificio/${selectedEdificio}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar edificio');
      }

      closeModal();
      loadSedesYEdificios();
      setSelectedEdificio(null);
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al actualizar edificio');
    }
  };

  const handleDeleteEdificio = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/edificio/${selectedEdificio}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar edificio');
      }

      closeModal();
      setSelectedEdificio(null);
      loadSedesYEdificios();
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al eliminar edificio');
    }
  };

  // Manejadores para sedes

  const handleAddSede = async (form) => {
    try {
      const response = await fetch('http://localhost:3000/api/sede', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear sede');
      }

      closeModal();
      loadSedesYEdificios();
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al crear sede');
    }
  };

  const handleEditSede = async (form) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/sede/${selectedSede}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar sede');
      }

      closeModal();
      loadSedesYEdificios();
      setSelectedSede(null);
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al actualizar sede');
    }
  };

  const handleDeleteSede = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/sede/${selectedSede}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar sede');
      }

      closeModal();
      setSelectedSede(null);
      loadSedesYEdificios();
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al eliminar sede');
    }
  };

  return (
    <Layout>
      <h1 className="mb-4">Gestión de Espacios</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'salas' ? 'active' : ''}`}
            onClick={() => setActiveTab('salas')}
          >
            Salas
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'edificios' ? 'active' : ''}`}
            onClick={() => setActiveTab('edificios')}
          >
            Edificios
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'sedes' ? 'active' : ''}`}
            onClick={() => setActiveTab('sedes')}
          >
            Sedes
          </button>
        </li>
      </ul>

      {activeTab === 'salas' && (
        <>
          <div className="mb-3">
            <button
              className="btn btn-success me-2"
              onClick={() => openModal('add', 'sala')}
            >
              Agregar
            </button>
            <button
              className="btn btn-warning me-2"
              onClick={() => openModal('edit', 'sala')}
              disabled={!selectedSala}
            >
              Modificar
            </button>
            <button
              className="btn btn-danger"
              onClick={() => openModal('delete', 'sala')}
              disabled={!selectedSala}
            >
              Eliminar
            </button>
          </div>

          {loading ? (
            <div>Cargando salas...</div>
          ) : (
            <table className="table table-bordered">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Capacidad</th>
                  <th>Edificio</th>
                </tr>
              </thead>
              <tbody>
                {salas.map((s) => (
                  <tr
                    key={`sala-${s.ID_SALA || Math.random()}`}
                    onClick={() => s.ID_SALA && setSelectedSala(s.ID_SALA)}
                    className={
                      s.ID_SALA === selectedSala ? 'table-primary' : ''
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{s.ID_SALA || 'N/A'}</td>
                    <td>{s.NOMBRE_SALA || 'N/A'}</td>
                    <td>{s.CAPACIDAD_SALA || 'N/A'}</td>
                    <td>
                      {s.SIGLA_EDIFICIO
                        ? `${s.SIGLA_EDIFICIO} - ${s.NOMBRE_EDIFICIO}`
                        : s.NOMBRE_EDIFICIO || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {activeTab === 'edificios' && (
        <>
          <div className="mb-3">
            <button
              className="btn btn-success me-2"
              onClick={() => openModal('add', 'edificio')}
            >
              Agregar Edificio
            </button>
            <button
              className="btn btn-warning me-2"
              onClick={() => openModal('edit', 'edificio')}
              disabled={!selectedEdificio}
            >
              Modificar Edificio
            </button>
            <button
              className="btn btn-danger"
              onClick={() => openModal('delete', 'edificio')}
              disabled={!selectedEdificio}
            >
              Eliminar Edificio
            </button>
          </div>

          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Sigla</th>
                <th>Sede</th>
              </tr>
            </thead>
            <tbody>
              {edificios.map((e) => (
                <tr
                  key={`edificio-${e.ID_EDIFICIO}`}
                  onClick={() => setSelectedEdificio(e.ID_EDIFICIO)}
                  className={
                    e.ID_EDIFICIO === selectedEdificio ? 'table-primary' : ''
                  }
                  style={{ cursor: 'pointer' }}
                >
                  <td>{e.ID_EDIFICIO}</td>
                  <td>{e.NOMBRE_EDIFICIO}</td>
                  <td>{e.SIGLA_EDIFICIO}</td>
                  <td>{e.NOMBRE_SEDE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {activeTab === 'sedes' && (
        <>
          <div className="mb-3">
            <button
              className="btn btn-success me-2"
              onClick={() => openModal('add', 'sede')}
            >
              Agregar Sede
            </button>
            <button
              className="btn btn-warning me-2"
              onClick={() => openModal('edit', 'sede')}
              disabled={!selectedSede}
            >
              Modificar
            </button>
            <button
              className="btn btn-danger"
              onClick={() => openModal('delete', 'sede')}
              disabled={!selectedSede}
            >
              Eliminar
            </button>
          </div>

          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
              </tr>
            </thead>
            <tbody>
              {sedes.map((s) => (
                <tr
                  key={`sede-${s.ID_SEDE}`}
                  onClick={() => setSelectedSede(s.ID_SEDE)}
                  className={s.ID_SEDE === selectedSede ? 'table-primary' : ''}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{s.ID_SEDE}</td>
                  <td>{s.NOMBRE_SEDE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Modales */}

      {/* Modales para Salas */}
      {modal.type === 'add' && modal.entity === 'sala' && (
        <Modal title="Agregar Sala" onClose={closeModal}>
          <SalaForm onSubmit={handleAdd} onCancel={closeModal} />
        </Modal>
      )}

      {modal.type === 'edit' && modal.entity === 'sala' && (
        <Modal title="Modificar Sala" onClose={closeModal}>
          <SalaForm
            initial={modal.data}
            onSubmit={handleEdit}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal.type === 'delete' && modal.entity === 'sala' && (
        <Modal title="Eliminar Sala" onClose={closeModal}>
          <div className="modal-body">
            <p>¿Está seguro que desea eliminar esta sala?</p>
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
                onClick={handleDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modales para Edificios */}

      {modal.type === 'add' && modal.entity === 'edificio' && (
        <Modal title="Agregar Edificio" onClose={closeModal}>
          <EdificioForm onSubmit={handleAddEdificio} onCancel={closeModal} />
        </Modal>
      )}

      {modal.type === 'edit' && modal.entity === 'edificio' && (
        <Modal title="Modificar Edificio" onClose={closeModal}>
          <EdificioForm
            initial={modal.data}
            onSubmit={handleEditEdificio}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal.type === 'delete' && modal.entity === 'edificio' && (
        <Modal title="Eliminar Edificio" onClose={closeModal}>
          <div className="modal-body">
            <p>¿Está seguro que desea eliminar este edificio?</p>
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
                onClick={handleDeleteEdificio}
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modales para Sedes */}
      {modal.type === 'add' && modal.entity === 'sede' && (
        <Modal title="Agregar Sede" onClose={closeModal}>
          <SedeForm onSubmit={handleAddSede} onCancel={closeModal} />
        </Modal>
      )}
      {modal.type === 'add' && modal.entity === 'sede' && (
        <Modal title="Agregar Sede" onClose={closeModal}>
          <SedeForm onSubmit={handleAddSede} onCancel={closeModal} />
        </Modal>
      )}

      {modal.type === 'edit' && modal.entity === 'sede' && (
        <Modal title="Modificar Sede" onClose={closeModal}>
          <SedeForm
            initial={modal.data}
            onSubmit={handleEditSede}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal.type === 'delete' && modal.entity === 'sede' && (
        <Modal title="Eliminar Sede" onClose={closeModal}>
          <div className="modal-body">
            <p>¿Está seguro que desea eliminar esta sede?</p>
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
                onClick={handleDeleteSede}
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
