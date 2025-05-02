import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Table = ({
  columns,
  data,
  pagination = null,
  onPageChange = null,
  isLoading = false,
  emptyMessage = 'No data available',
}) => {
  const [selectedRow, setSelectedRow] = useState(null);

  // Render pagination controls
  const renderPagination = () => {
    if (!pagination) return null;

    const { currentPage, totalPages } = pagination;

    return (
      <div className="flex items-center justify-between border-t border-dark-border px-4 py-3">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-dark-border text-sm font-medium rounded-md text-gray-300 bg-dark-light ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`relative ml-3 inline-flex items-center px-4 py-2 border border-dark-border text-sm font-medium rounded-md text-gray-300 bg-dark-light ${
              currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark'
            }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-400">
              Showing page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-dark-border bg-dark-light text-sm font-medium text-gray-300 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark'
                }`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              
              {/* Page numbers */}
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                // Display current page, first, last, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-primary-500 border-primary-600 text-white'
                          : 'border-dark-border bg-dark-light text-gray-300 hover:bg-dark'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                
                // Show ellipsis for skipped pages
                if (
                  (page === 2 && currentPage > 3) ||
                  (page === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return (
                    <span
                      key={page}
                      className="relative inline-flex items-center px-4 py-2 border border-dark-border bg-dark-light text-sm font-medium text-gray-300"
                    >
                      ...
                    </span>
                  );
                }
                
                return null;
              })}
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-dark-border bg-dark-light text-sm font-medium text-gray-300 ${
                  currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark'
                }`}
              >
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-dark-lighter shadow rounded-lg overflow-hidden">
        <div className="animate-pulse">
          <div className="border-b border-dark-border">
            <div className="flex px-6 py-3">
              {columns.map((column, index) => (
                <div
                  key={index}
                  className="flex-1 h-6 bg-dark-light rounded"
                  style={{ width: column.width || 'auto' }}
                />
              ))}
            </div>
          </div>
          <div>
            {[...Array(5)].map((_, rowIndex) => (
              <div key={rowIndex} className="border-b border-dark-border">
                <div className="flex px-6 py-4">
                  {columns.map((_, colIndex) => (
                    <div
                      key={colIndex}
                      className="flex-1 h-5 bg-dark-light rounded"
                      style={{ width: columns[colIndex].width || 'auto' }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {renderPagination()}
      </div>
    );
  }

  // Render empty state
  if (!data || data.length === 0) {
    return (
      <div className="bg-dark-lighter shadow rounded-lg overflow-hidden">
        <div className="border-b border-dark-border">
          <div className="flex px-6 py-3">
            {columns.map((column, index) => (
              <div
                key={index}
                className="font-medium text-gray-300 flex-1"
                style={{ width: column.width || 'auto' }}
              >
                {column.header}
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-12 text-center">
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
        {renderPagination()}
      </div>
    );
  }

  // Render table
  return (
    <div className="bg-dark-lighter shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-dark-border">
          <thead className="bg-dark-light">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  style={{ width: column.width || 'auto' }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`
                  ${selectedRow === rowIndex ? 'bg-dark-light' : 'hover:bg-dark'}
                  ${row.clickable ? 'cursor-pointer' : ''}
                `}
                onClick={() => {
                  if (row.onClick) row.onClick();
                  if (row.clickable) setSelectedRow(rowIndex);
                }}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                  >
                    {column.render ? column.render(row) : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};

export default Table; 