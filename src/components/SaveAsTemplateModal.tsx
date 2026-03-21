'use client';

import type { JSX } from 'react';
import { useState, useEffect, useRef } from 'react';

export interface SaveAsTemplateModalProps {
  isOpen: boolean;
  defaultName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const SaveAsTemplateModal = ({
  isOpen,
  defaultName,
  onSave,
  onCancel,
  isSaving = false,
}: SaveAsTemplateModalProps): JSX.Element | null => {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      const t = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(t);
    }
  }, [isOpen, defaultName]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onSave(name.trim());
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto p-4 overscroll-contain"
      style={{ background: 'rgba(10,10,8,0.82)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-as-template-title"
    >
      <div
        ref={modalRef}
        className="max-w-md w-full"
        style={{
          background: '#201D1A',
          border: '1px solid rgba(255,255,255,0.11)',
          borderTop: '2px solid #E05C1A',
          borderRadius: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ width: '14px', height: '1px', background: '#E05C1A' }} />
          <h2
            id="save-as-template-title"
            style={{
              fontFamily: 'Barlow, sans-serif',
              fontSize: '13px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#F4F2EE',
            }}
          >
            Save as template
          </h2>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '22px' }}>
          <label
            htmlFor="template-name"
            style={{
              display: 'block',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '9px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#5C574F',
              marginBottom: '8px',
            }}
          >
            Template name
          </label>
          <input
            ref={inputRef}
            id="template-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Meeting notes"
            disabled={isSaving}
            style={{
              width: '100%',
              padding: '11px 14px',
              border: '1px solid rgba(255,255,255,0.11)',
              background: '#2A2520',
              color: '#F4F2EE',
              fontFamily: 'Barlow, sans-serif',
              fontSize: '13px',
              borderRadius: 0,
              marginBottom: '20px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              style={{
                background: 'transparent',
                color: '#A8A39A',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '8px 18px',
                border: '1px solid rgba(255,255,255,0.11)',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              style={{
                background: '#E05C1A',
                color: '#fff',
                fontFamily: 'Barlow, sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                padding: '8px 22px',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              {isSaving ? 'Saving...' : 'Save template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
