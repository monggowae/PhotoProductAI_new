import React from 'react';

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, description, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>}
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}