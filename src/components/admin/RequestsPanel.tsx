import React from 'react';
import { Download } from 'lucide-react';
import { RequestFilters } from './RequestFilters';
import { RequestsTable } from './RequestsTable';
import { Pagination } from './Pagination';
import { TokenRequest } from '../../types/auth';

interface RequestsPanelProps {
  requests: TokenRequest[];
  statusFilter: string;
  dateRange: { start: string; end: string };
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onStatusChange: (status: string) => void;
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onSearchChange: (term: string) => void;
  onPageChange: (page: number) => void;
  onApprove: (requestId: string, amount: number) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
  onUpdateAmount: (requestId: string, amount: number) => Promise<void>;
  onExport: () => void;
}

export function RequestsPanel({
  requests,
  statusFilter,
  dateRange,
  searchTerm,
  currentPage,
  totalPages,
  loading,
  onStatusChange,
  onDateRangeChange,
  onSearchChange,
  onPageChange,
  onApprove,
  onReject,
  onUpdateAmount,
  onExport
}: RequestsPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Token Requests</h2>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      <RequestFilters
        statusFilter={statusFilter}
        dateRange={dateRange}
        searchTerm={searchTerm}
        onStatusChange={onStatusChange}
        onDateRangeChange={onDateRangeChange}
        onSearchChange={onSearchChange}
      />

      <div className="overflow-x-auto">
        <RequestsTable
          requests={requests}
          onApprove={onApprove}
          onReject={onReject}
          onUpdateAmount={onUpdateAmount}
          loading={loading}
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}