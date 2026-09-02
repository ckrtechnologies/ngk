import React, { useState } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react';

/**
 * Sophisticated Multi-Facet Filter Toolbar with CSV & PDF Exports
 */
export const FilterBar = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  facets = [], // [{ id, label, count }]
  onFacetSelect,
  activeFacet,
  sortBy,
  onSortChange,
  sortOptions = [
    { id: 'newest', label: 'Newest First' },
    { id: 'oldest', label: 'Oldest First' },
    { id: 'name_asc', label: 'Name (A-Z)' },
    { id: 'name_desc', label: 'Name (Z-A)' },
  ],
  onClearAll,
  totalResults = 0,
  actionButton = null,
  onExportCSV = null,
  onExportPDF = null,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const hasActiveFilters = !!searchQuery || (activeFacet && activeFacet !== 'ALL');
  const hasExport = onExportCSV || onExportPDF;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3 space-y-3 select-none">
      {/* Top Row: Search + Sort + Export + Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Search Field */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Tools: Sort + Export + Action */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {onSortChange && (
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="h-9 pl-8 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 appearance-none cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Export Dropdown */}
          {hasExport && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="h-9 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowExportMenu(false)}
                  ></div>
                  <div className="absolute right-0 top-10 w-38 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1 space-y-0.5 animate-scale-up">
                    {onExportCSV && (
                      <button
                        onClick={() => {
                          setShowExportMenu(false);
                          onExportCSV();
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Export CSV</span>
                      </button>
                    )}
                    {onExportPDF && (
                      <button
                        onClick={() => {
                          setShowExportMenu(false);
                          onExportPDF();
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-red" />
                        <span>Export PDF</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {hasActiveFilters && onClearAll && (
            <button
              onClick={onClearAll}
              className="h-9 px-2.5 text-[11px] font-bold text-slate-500 hover:text-brand-red bg-slate-100 hover:bg-rose-50 border border-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          )}

          {actionButton}
        </div>
      </div>

      {/* Bottom Row: Facet Chips with Live Badges */}
      {facets.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Filter:
            </span>
            {facets.map((f) => {
              const isSelected = activeFacet === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => onFacetSelect(f.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-tight inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  <span>{f.label}</span>
                  {f.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                        isSelected
                          ? 'bg-brand-red text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-bold text-slate-500 whitespace-nowrap pl-2">
            Showing <span className="text-slate-900 font-extrabold">{totalResults}</span> records
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
