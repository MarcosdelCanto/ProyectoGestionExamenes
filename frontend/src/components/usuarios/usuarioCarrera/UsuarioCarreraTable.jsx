// src/components/usuarios/usuarioCarrera/UsuarioCarreraTable.jsx
// ESTE ARCHIVO ESTÁ CORRECTO Y COMPLETO.
import React, { useMemo } from 'react';
import { Table, Button } from 'react-bootstrap';

function UsuarioCarreraTable({
  onOpenViewCarrerasModal,
  groupedAssociations,
  eligibleUsers,
  selectedUsersInTab, // Array de OBJETOS usuario que están seleccionados
  processing,
  loading,
  onToggleUserSelection,
  onToggleSelectAllUsers,
  onEditUserAssociations,
  onDeleteAllUserAssociations,
}) {
  if (loading && Object.keys(groupedAssociations).length === 0) {
    return <p className="text-center p-3">Cargando asociaciones...</p>;
  }

  const usersInCurrentView = useMemo(() => {
    if (!Array.isArray(eligibleUsers)) return [];
    return Object.keys(groupedAssociations)
      .map((userIdStr) => {
        const userIdNum = parseInt(userIdStr, 10);
        return eligibleUsers.find((u) => u.ID_USUARIO === userIdNum);
      })
      .filter(Boolean);
  }, [groupedAssociations, eligibleUsers]);

  return (
    <Table bordered hover responsive>
      <thead className="table-light position-sticky top-0">
        <tr>
          <th style={{ width: '5%' }} className="text-center align-middle">
            <input
              type="checkbox"
              className="form-check-input"
              checked={
                usersInCurrentView.length > 0 &&
                selectedUsersInTab.length === usersInCurrentView.length &&
                usersInCurrentView.every((u) =>
                  selectedUsersInTab.some(
                    (su) => su.ID_USUARIO === u.ID_USUARIO
                  )
                )
              }
              onChange={onToggleSelectAllUsers}
              disabled={usersInCurrentView.length === 0 || processing}
            />
          </th>
          <th>Usuario</th>
          <th>Rol</th>
          <th>Carreras Asociadas</th>
        </tr>
      </thead>
      <tbody>
        {usersInCurrentView.length === 0 && !loading && (
          <tr>
            <td colSpan="5" className="text-center">
              No hay usuarios elegibles (Coordinador/Director) con asociaciones
              de carrera para mostrar.
            </td>
          </tr>
        )}
        {usersInCurrentView.map((userObject) => {
          const userIdNum = userObject.ID_USUARIO;
          const data = groupedAssociations[userIdNum];

          if (!data) return null;

          const isSelected = selectedUsersInTab.some(
            (selectedUser) => selectedUser.ID_USUARIO === userIdNum
          );

          return (
            <tr
              key={userIdNum}
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
                  disabled={processing}
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
                {data.carreras.length > 0 ? (
                  <Button
                    variant="outline-secondary" // Coherente con el otro botón "Ver"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(
                        '[UsuarioCarreraTable] Clic en "Ver Carreras" para userId:',
                        userIdNum
                      ); // userIdNum es el ID del usuario de esa fila
                      console.log(
                        '[UsuarioCarreraTable] Prop onOpenViewCarrerasModal:',
                        onOpenViewCarrerasModal
                      );
                      if (typeof onOpenViewCarrerasModal === 'function') {
                        onOpenViewCarrerasModal(userIdNum);
                      } else {
                        console.error(
                          '[UsuarioCarreraTable] ERROR: onOpenViewCarrerasModal no es una función!'
                        );
                      }
                    }}
                    title="Ver carreras asociadas"
                    disabled={processing}
                  >
                    <i className="bi bi-eye-fill"></i> Ver (
                    {data.carreras.length}) {/* Icono Bootstrap */}
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

export default UsuarioCarreraTable;
