import React from 'react';
import { Table, Button } from 'react-bootstrap';

function UsuarioCarreraTable({
  groupedAssociations,
  eligibleUsers,
  selectedUsersInTab,
  processing,
  loading,
  onToggleUserSelection,
  onToggleSelectAllUsers,
  onOpenViewCarrerasModal,
  onEditUserAssociations,
  onDeleteAllUserAssociations,
}) {
  if (loading && Object.keys(groupedAssociations).length === 0) {
    return null;
  }

  return (
    <Table bordered hover responsive>
      <thead>
        <tr>
          <th style={{ width: '5%' }} className="text-center align-middle">
            <input
              type="checkbox"
              className="form-check-input"
              checked={
                Object.keys(groupedAssociations).length > 0 &&
                selectedUsersInTab.length ===
                  Object.keys(groupedAssociations)
                    .map((userId) =>
                      eligibleUsers.find(
                        (u) => u.ID_USUARIO === parseInt(userId)
                      )
                    )
                    .filter(Boolean).length
              }
              onChange={onToggleSelectAllUsers}
              disabled={Object.keys(groupedAssociations).length === 0}
            />
          </th>
          <th>Usuario</th>
          <th>Rol</th>
          <th>Carreras Asociadas</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(groupedAssociations).length === 0 && !loading && (
          <tr>
            <td colSpan="5" className="text-center">
              No hay asociaciones registradas.
            </td>
          </tr>
        )}
        {Object.entries(groupedAssociations).map(([userId, data]) => {
          const userObject = eligibleUsers.find(
            (u) => u.ID_USUARIO === parseInt(userId)
          );
          if (!userObject) return null;
          const isSelected = selectedUsersInTab.some(
            (su) => su.ID_USUARIO === parseInt(userId)
          );

          return (
            <tr
              key={userId}
              onClick={() => onToggleUserSelection(userObject)}
              className={isSelected ? 'table-primary' : ''}
              style={{ cursor: 'pointer' }}
            >
              <td className="text-center align-middle">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleUserSelection(userObject);
                  }}
                />
              </td>
              <td className="align-middle">
                {data.NOMBRE_USUARIO} <br />
                <small className="text-muted">{data.EMAIL_USUARIO}</small>
              </td>
              <td className="align-middle">{data.ROL_USUARIO}</td>
              <td className="text-center align-middle">
                {data.carreras.length > 0 ? (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenViewCarrerasModal(parseInt(userId));
                    }}
                    title="Ver carreras asociadas"
                  >
                    <i className="bi bi-eye"></i> Ver ({data.carreras.length})
                  </Button>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td className="text-nowrap align-middle">
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditUserAssociations(parseInt(userId));
                  }}
                  disabled={processing}
                  title="Editar asociaciones"
                >
                  <i className="bi bi-pencil-square"></i>
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAllUserAssociations(parseInt(userId));
                  }}
                  disabled={processing || data.carreras.length === 0}
                  title="Eliminar todas las asociaciones del usuario"
                >
                  <i className="bi bi-trash3"></i>
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

export default UsuarioCarreraTable;
