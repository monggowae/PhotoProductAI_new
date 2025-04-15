import React from 'react';

interface RequestFiltersProps {
  statusFilter: string;
  dateRange: { start: string; end: string };
  searchTerm: string;
  onStatusChange: (status: string) => void;
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onSearchChange: (term: string) => void;
}

export function RequestFilters({
  statusFilter,
  dateRange,
  searchTerm,
  onStatusChange,
  onDateRangeChange,
  onSearchChange
}: RequestFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by email..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>
    </div>
  );
}