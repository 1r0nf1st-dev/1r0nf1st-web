'use client';

import type { JSX } from 'react';
import { ConfirmModal } from './ConfirmModal';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const ConfirmDeleteModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  isLoading = false,
  errorMessage = null,
}: ConfirmDeleteModalProps): JSX.Element | null => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onCancel}
    onConfirm={onConfirm}
    title={title}
    message={message}
    warning="This action cannot be undone"
    confirmLabel={confirmLabel}
    cancelLabel="Cancel"
    variant="destructive"
    icon="🗑"
    isLoading={isLoading}
    errorMessage={errorMessage}
  />
);
