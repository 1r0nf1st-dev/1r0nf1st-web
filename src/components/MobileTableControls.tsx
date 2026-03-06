'use client';

import type { JSX } from 'react';
import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { MoreVertical, Plus, Trash2, Columns, Rows } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Tooltip } from './Tooltip';
import { btnBase, btnGhost } from '../styles/buttons';

interface MobileTableControlsProps {
  editor: Editor;
}

/**
 * Mobile-friendly table controls.
 * Shows a floating menu with table editing options when a table is active.
 */
export const MobileTableControls = ({ editor }: MobileTableControlsProps): JSX.Element | null => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isTableActive = editor.isActive('table');

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  // Close menu on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [menuOpen]);

  if (!isMobile || !isTableActive) {
    return null;
  }

  const MenuButton = ({
    onClick,
    disabled,
    ariaLabel,
    icon: Icon,
    label,
  }: {
    onClick: () => void;
    disabled?: boolean;
    ariaLabel: string;
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    label: string;
  }): JSX.Element => (
    <button
      type="button"
      onClick={() => {
        onClick();
        setMenuOpen(false);
      }}
      disabled={disabled}
      className={`${btnBase} ${btnGhost} w-full justify-start gap-2 text-sm min-h-[44px] px-3 py-2`}
      aria-label={ariaLabel}
    >
      <Icon className="w-4 h-4" aria-hidden />
      <span>{label}</span>
    </button>
  );

  return (
    <div ref={menuRef} className="fixed bottom-4 right-4 z-50">
      <Tooltip content="Table controls">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className={`${btnBase} ${btnGhost} w-12 h-12 shadow-lg bg-white dark:bg-surface border-2 border-primary/40 dark:border-border flex items-center justify-center`}
          aria-label="Table controls"
          aria-expanded={menuOpen}
        >
          <MoreVertical className="w-5 h-5" aria-hidden />
        </button>
      </Tooltip>

      {menuOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-56 rounded-xl border border-primary/20 dark:border-border bg-white dark:bg-surface shadow-xl p-2">
          <div className="flex flex-col gap-1">
            <div className="px-2 py-1 text-xs font-semibold text-muted uppercase">Columns</div>
            <MenuButton
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              disabled={!editor.can().addColumnBefore()}
              ariaLabel="Add Column Before"
              icon={Columns}
              label="Add Column Before"
            />
            <MenuButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.can().addColumnAfter()}
              ariaLabel="Add Column After"
              icon={Columns}
              label="Add Column After"
            />
            <MenuButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              disabled={!editor.can().deleteColumn()}
              ariaLabel="Delete Column"
              icon={Trash2}
              label="Delete Column"
            />

            <div className="px-2 py-1 text-xs font-semibold text-muted uppercase mt-2">Rows</div>
            <MenuButton
              onClick={() => editor.chain().focus().addRowBefore().run()}
              disabled={!editor.can().addRowBefore()}
              ariaLabel="Add Row Before"
              icon={Rows}
              label="Add Row Before"
            />
            <MenuButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.can().addRowAfter()}
              ariaLabel="Add Row After"
              icon={Rows}
              label="Add Row After"
            />
            <MenuButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              disabled={!editor.can().deleteRow()}
              ariaLabel="Delete Row"
              icon={Trash2}
              label="Delete Row"
            />

            <div className="border-t border-primary/20 dark:border-border my-1" />

            <MenuButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
              ariaLabel="Delete Table"
              icon={Trash2}
              label="Delete Table"
            />
          </div>
        </div>
      )}
    </div>
  );
};
