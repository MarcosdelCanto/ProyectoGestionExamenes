import React from 'react';
import { Table, Button } from 'react-bootstrap';

function UsuarioSeccionTable({
  groupedAssociations,
  eligibleUsers, // Necesario para el checkbox "seleccionar todos" y para obtener el objeto usuario
  selectedUsersInTab,
  processing,
  loading,
  onToggleUserSelection,
  onToggleSelectAllUsers,
  onOpenViewSeccionesModal,
  onEditUserAssociations,
  onDeleteAllUserAssociations,
}) {
  if (loading && Object.keys(groupedAssociations).length === 0) {
    return null; // El Spinner principal ya está en UsuarioSeccionTab
  }

  return (
    <Table bordered hover responsive>
      <thead className="table-light position-sticky top-0">
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
          <th>Secciones Asociadas</th>
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
                <small className="text-muted">
                  {data.EMAIL_USUARIO || 'Email no disponible'}
                </small>
              </td>
              <td className="align-middle">{data.ROL_USUARIO}</td>
              <td className="text-center align-middle">
                {data.secciones.length > 0 ? (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenViewSeccionesModal(parseInt(userId));
                    }}
                    title="Ver secciones asociadas"
                  >
                    <i className="bi bi-eye"></i> Ver ({data.secciones.length})
                  </Button>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

export default UsuarioSeccionTable;
