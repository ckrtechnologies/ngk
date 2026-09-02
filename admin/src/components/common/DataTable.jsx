import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox, Loader2 } from 'lucide-react';

/**
 * High-Density Compact Data Table with Built-in Pagination
 */
export const DataTable = ({
  columns = [], // [{ key, label, sortable, render, width, align }]
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  pageSizeOptions = [10, 25, 50, 100],
  initialPageSize = 25,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Pagination Math
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentData = data.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Table Content */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse table-compact">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key || col.label}
                  style={{ width: col.width }}
                  className={`text-${col.align || 'left'} select-none`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
                    <span className="text-xs font-semibold text-slate-500">Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                    <span className="text-xs font-bold text-slate-500">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              currentData.map((row, rIdx) => (
                <tr key={row.id || rIdx} className="hover:bg-slate-50/80 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key || col.label}
                      className={`text-${col.align || 'left'}`}
                    >
                      {col.render ? col.render(row, rIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 bg-slate-50/70 border-t border-slate-200/60 gap-3 text-xs text-slate-600">
          {/* Rows per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="h-7 px-2 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-red cursor-pointer"
            >
              {pageSizeOptions.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
            <span className="text-[11px] font-semibold text-slate-400 ml-2">
              Showing <span className="font-bold text-slate-700">{totalItems === 0 ? 0 : startIndex + 1}</span>–
              <span className="font-bold text-slate-700">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-700">{totalItems}</span>
            </span>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-1 rounded-md text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 rounded-md text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2.5 py-0.5 text-xs font-extrabold text-slate-800 bg-white border border-slate-200 rounded-md shadow-2xs">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
