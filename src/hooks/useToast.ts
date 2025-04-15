import { useState, useCallback } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

export function useToast(duration = 3000) {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    visible: false
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, duration);
  }, [duration]);

  return { toast, showToast };
}