import type { JSX } from 'react';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';

export interface SaveConfirmationModalProps {
  isOpen: boolean;
  onReturnToDashboard: () => void;
  onContinueEditing: () => void;
}

export const SaveConfirmationModal = ({
  isOpen,
  onReturnToDashboard,
  onContinueEditing,
}: SaveConfirmationModalProps): JSX.Element | null => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
      onClick={onReturnToDashboard}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-confirmation-title"
    >
      <div
        className="bg-white dark:bg-surface rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border-2 border-primary/40 dark:border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="save-confirmation-title"
          className="text-xl font-semibold mb-4 text-foreground"
        >
          Note Saved Successfully
        </h2>
        <p className="text-muted mb-6">
          What would you like to do next?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onReturnToDashboard}
            className={`${btnBase} ${btnPrimary} flex-1`}
          >
            Return to Dashboard
          </button>
          <button
            type="button"
            onClick={onContinueEditing}
            className={`${btnBase} ${btnGhost} flex-1`}
          >
            Continue Editing
          </button>
        </div>
      </div>
    </div>
  );
};
