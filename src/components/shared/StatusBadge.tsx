import React from 'react';

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`
      px-2 py-1 rounded-full text-xs font-medium
      ${styles[status]}
      ${className}
    `}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}