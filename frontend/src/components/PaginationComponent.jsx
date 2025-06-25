import React from 'react';
import { Pagination } from 'react-bootstrap';

function PaginationComponent({
  itemsPerPage,
  totalItems,
  paginate,
  currentPage,
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null; // No mostrar paginación si solo hay una página o menos
  }

  const pageNeighbours = 1; // Cuántas páginas mostrar a cada lado de la actual. 1 significa: prev, current, next

  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - pageNeighbours);
    const endPage = Math.min(totalPages, currentPage + pageNeighbours);

    // Siempre añadir la primera página
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...'); // Elipsis si hay un salto después de la primera página
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Siempre añadir la última página
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...'); // Elipsis si hay un salto antes de la última página
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbersToDisplay = getPageNumbers();

  return (
    <div className="d-flex justify-content-center">
      {/* Puedes añadir una clase contenedora para estilos más específicos */}
      <Pagination className="custom-pagination">
        <Pagination.First
          onClick={() => paginate(1)}
          disabled={currentPage === 1}
        >
          <i className="bi bi-chevron-double-left"></i>
          {/* Ejemplo con Bootstrap Icons */}
        </Pagination.First>
        <Pagination.Prev
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="bi bi-chevron-left"></i>
        </Pagination.Prev>

        {pageNumbersToDisplay.map((page, index) => {
          if (page === '...') {
            return <Pagination.Ellipsis key={`ellipsis-${index}`} disabled />;
          }
          return (
            <Pagination.Item
              key={page}
              active={page === currentPage}
              onClick={() => paginate(page)}
            >
              {page}
            </Pagination.Item>
          );
        })}

        <Pagination.Next
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <i className="bi bi-chevron-right"></i>
        </Pagination.Next>
        <Pagination.Last
          onClick={() => paginate(totalPages)}
          disabled={currentPage === totalPages}
        >
          <i className="bi bi-chevron-double-right"></i>
        </Pagination.Last>
      </Pagination>
    </div>
  );
}

export default PaginationComponent;
