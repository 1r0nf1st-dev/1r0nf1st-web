'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

interface AlertContextValue {
  showAlert: (message: string, title?: string) => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }): ReactNode {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState<string | undefined>(undefined);

  const showAlert = useCallback((msg: string, t?: string) => {
    setMessage(msg);
    setTitle(t ?? 'Notice');
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <ConfirmModal
        isOpen={open}
        onClose={handleClose}
        onConfirm={handleClose}
        title={title ?? 'Notice'}
        message={message}
        confirmLabel="OK"
        variant="confirm"
        hideCancel
      />
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (ctx === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return ctx;
}
