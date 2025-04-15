import React from 'react';
import { Input } from './Input';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  helper?: string;
  type?: string;
}

export function FormField({ 
  label, 
  error, 
  icon, 
  helper,
  type = 'text',
  className = '',
  ...props 
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          className={`
            w-full rounded-lg border border-gray-300 
            px-3 py-2 min-h-[200px]
            focus:outline-none focus:ring-2 focus:ring-purple-500
            text-sm sm:text-base
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      ) : (
        <Input
          type={type}
          icon={icon}
          error={error}
          className={`w-full ${className}`}
          {...props}
        />
      )}
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}