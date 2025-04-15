import React from 'react';
import { Button } from './Button';

interface FormActionsProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  className?: string;
}

export function FormActions({
  onCancel,
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  loading = false,
  className = ''
}: FormActionsProps) {
  return (
    <div className={`flex justify-end gap-2 ${className}`}>
      {onCancel && (
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelText}
        </Button>
      )}
      {onSubmit && (
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          onClick={onSubmit}
        >
          {submitText}
        </Button>
      )}
    </div>
  );
}