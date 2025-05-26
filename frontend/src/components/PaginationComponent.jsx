import React from 'react';
import { Pagination } from 'react-bootstrap';

function PaginationComponent({
  itemsPerPage,
  totalItems,
  paginate,
  currentPage,
}) {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  if (pageNumbers.length <= 1) {
    return null; // No mostrar paginación si solo hay una página o menos
  }

  return (
    <div className="d-flex justify-content-center">
      <Pagination>
        {pageNumbers.map((number) => (
          <Pagination.Item
            key={number}
            active={number === currentPage}
            onClick={() => paginate(number)}
          >
            {number}
          </Pagination.Item>
        ))}
      </Pagination>
    </div>
  );
}

export default PaginationComponent;
