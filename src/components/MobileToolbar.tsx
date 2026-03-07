'use client';

import type { JSX } from 'react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';
import { MoreVertical, Bold, Italic, List, ListOrdered, Link as LinkIcon, CheckSquare, Table as TableIcon, Image as ImageIcon, Undo2, Redo2, Mic, Circle, Loader2 } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Tooltip } from './Tooltip';
import {
  btnToolbar,
  btnToolbarActive,
  btnToolbarInactive,
} from '../styles/buttons';

interface MobileToolbarProps {
  editor: Editor;
  /** Additional toolbar items to show in "More" menu */
  moreItems?: JSX.Element[];
  /** Notes for linking (if provided, shows link-to-note button) */
  notesForLinking?: Array<{ id: string; title: string }>;
  /** Callback when link to note is selected */
  onLinkToNote?: (note: { id: string; title: string }) => void;
  /** Whether speech-to-text is active */
  isListening?: boolean;
  /** Callback for speech-to-text toggle */
  onToggleSpeech?: () => void;
  /** Whether OCR is loading */
  ocrLoading?: boolean;
  /** Callback for OCR file input */
  onOcrClick?: () => void;
  /** Whether audio transcription is loading */
  audioTranscribeLoading?: boolean;
  /** Callback for audio transcription file input */
  onAudioTranscribeClick?: () => void;
  /** Whether Record & transcribe is recording */
  isRecordAndTranscribeRecording?: boolean;
  /** Whether Record & transcribe is transcribing */
  recordAndTranscribeLoading?: boolean;
  /** Callback for Record & transcribe toggle */
  onRecordAndTranscribeToggle?: () => void;
  /** Whether Record & transcribe is supported */
  recordAndTranscribeSupported?: boolean;
}

/**
 * Mobile-optimized toolbar for note editor.
 * Shows most common tools, groups less-used tools in "More" menu.
 */
export const MobileToolbar = ({
  editor,
  moreItems = [],
  notesForLinking,
  onLinkToNote,
  isListening = false,
  onToggleSpeech,
  ocrLoading = false,
  onOcrClick,
  audioTranscribeLoading = false,
  onAudioTranscribeClick,
  isRecordAndTranscribeRecording = false,
  recordAndTranscribeLoading = false,
  onRecordAndTranscribeToggle,
  recordAndTranscribeSupported = true,
}: MobileToolbarProps): JSX.Element => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  // Update dropdown position when opening
  useEffect(() => {
    if (moreMenuOpen && moreMenuRef.current) {
      const rect = moreMenuRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [moreMenuOpen]);

  // Close menu when clicking outside (button or portal dropdown)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as Node;
      const inButton = moreMenuRef.current?.contains(target);
      const inDropdown = moreDropdownRef.current?.contains(target);
      if (!inButton && !inDropdown) {
        setMoreMenuOpen(false);
      }
    };
    const handleScroll = (): void => setMoreMenuOpen(false);
    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [moreMenuOpen]);

  // Close menu on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && moreMenuOpen) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [moreMenuOpen]);

  if (!isMobile) {
    // On desktop, render nothing (use regular toolbar)
    return <></>;
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    ariaLabel,
    children,
    disabled,
  }: {
    onClick: () => void;
    isActive?: boolean;
    ariaLabel: string;
    children: React.ReactNode;
    disabled?: boolean;
  }): JSX.Element => (
    <Tooltip content={ariaLabel}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${btnToolbar} ${isActive ? btnToolbarActive : btnToolbarInactive}`}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    </Tooltip>
  );

  return (
    <div className="border-b border-primary/20 dark:border-border p-2 flex items-center gap-2 bg-gray-50 dark:bg-surface-soft overflow-x-auto touch-scroll min-w-0">
      {/* More tools FIRST so always visible without horizontal scroll */}
      <div ref={moreMenuRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMoreMenuOpen(!moreMenuOpen)}
          className={`${btnToolbar} ${moreMenuOpen ? btnToolbarActive : btnToolbarInactive} touch-manipulation min-h-[44px] min-w-[44px]`}
          aria-label="More tools"
          aria-expanded={moreMenuOpen}
        >
          <MoreVertical className="w-4 h-4" aria-hidden />
        </button>

        {moreMenuOpen &&
          dropdownPosition &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={(el) => {
                moreDropdownRef.current = el;
              }}
              role="menu"
              className="fixed z-[9999] w-56 max-h-96 overflow-y-auto touch-scroll rounded-xl border border-primary/20 dark:border-border bg-white dark:bg-surface shadow-lg p-2"
              style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
            >
              <div className="flex flex-col gap-1">
              {/* Link */}
              <ToolbarButton
                onClick={() => {
                  const url = window.prompt('Enter URL:');
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                  setMoreMenuOpen(false);
                }}
                isActive={editor.isActive('link')}
                ariaLabel="Add Link"
              >
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" aria-hidden />
                  <span className="text-sm">Link</span>
                </div>
              </ToolbarButton>

              {/* Task List */}
              <ToolbarButton
                onClick={() => {
                  editor.chain().focus().toggleTaskList().run();
                  setMoreMenuOpen(false);
                }}
                isActive={editor.isActive('taskList')}
                ariaLabel="Task List"
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" aria-hidden />
                  <span className="text-sm">Task List</span>
                </div>
              </ToolbarButton>

              {/* Table */}
              <ToolbarButton
                onClick={() => {
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                  setMoreMenuOpen(false);
                }}
                ariaLabel="Insert Table"
              >
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4" aria-hidden />
                  <span className="text-sm">Table</span>
                </div>
              </ToolbarButton>

              {/* Image */}
              <ToolbarButton
                onClick={() => {
                  const url = window.prompt('Enter image URL:');
                  if (url) {
                    editor.chain().focus().setImage({ src: url }).run();
                  }
                  setMoreMenuOpen(false);
                }}
                ariaLabel="Insert Image"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" aria-hidden />
                  <span className="text-sm">Image</span>
                </div>
              </ToolbarButton>

              {/* Undo */}
              <ToolbarButton
                onClick={() => {
                  editor.chain().focus().undo().run();
                  setMoreMenuOpen(false);
                }}
                ariaLabel="Undo"
                disabled={!editor.can().undo()}
              >
                <div className="flex items-center gap-2">
                  <Undo2 className="w-4 h-4" aria-hidden />
                  <span className="text-sm">Undo</span>
                </div>
              </ToolbarButton>

              {/* Redo */}
              <ToolbarButton
                onClick={() => {
                  editor.chain().focus().redo().run();
                  setMoreMenuOpen(false);
                }}
                ariaLabel="Redo"
                disabled={!editor.can().redo()}
              >
                <div className="flex items-center gap-2">
                  <Redo2 className="w-4 h-4" aria-hidden />
                  <span className="text-sm">Redo</span>
                </div>
              </ToolbarButton>

              {/* Speech to text */}
              {onToggleSpeech && (
                <ToolbarButton
                  onClick={() => {
                    onToggleSpeech();
                    setMoreMenuOpen(false);
                  }}
                  isActive={isListening}
                  ariaLabel={isListening ? 'Stop voice input' : 'Voice input'}
                >
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4" aria-hidden />
                    <span className="text-sm">Voice Input</span>
                  </div>
                </ToolbarButton>
              )}

              {/* Record & transcribe */}
              {onRecordAndTranscribeToggle && recordAndTranscribeSupported && (
                <ToolbarButton
                  onClick={() => {
                    onRecordAndTranscribeToggle();
                    if (!isRecordAndTranscribeRecording && !recordAndTranscribeLoading) {
                      setMoreMenuOpen(false);
                    }
                  }}
                  isActive={isRecordAndTranscribeRecording}
                  disabled={recordAndTranscribeLoading}
                  ariaLabel={
                    isRecordAndTranscribeRecording
                      ? 'Stop recording and transcribe'
                      : recordAndTranscribeLoading
                        ? 'Transcribing...'
                        : 'Record & transcribe'
                  }
                >
                  <div className="flex items-center gap-2">
                    {recordAndTranscribeLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    ) : isRecordAndTranscribeRecording ? (
                      <Circle className="w-4 h-4 fill-red-500 text-red-500" aria-hidden />
                    ) : (
                      <Mic className="w-4 h-4" aria-hidden />
                    )}
                    <span className="text-sm">Record & transcribe</span>
                  </div>
                </ToolbarButton>
              )}

              {/* Additional items */}
              {moreItems.map((item, index) => (
                <div key={index} onClick={() => setMoreMenuOpen(false)}>
                  {item}
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
      </div>

      {/* Primary tools */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        ariaLabel="Bold"
        disabled={!editor.can().chain().focus().toggleBold().run()}
      >
        <Bold className="w-4 h-4" aria-hidden />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        ariaLabel="Italic"
        disabled={!editor.can().chain().focus().toggleItalic().run()}
      >
        <Italic className="w-4 h-4" aria-hidden />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        ariaLabel="Bullet List"
      >
        <List className="w-4 h-4" aria-hidden />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        ariaLabel="Numbered List"
      >
        <ListOrdered className="w-4 h-4" aria-hidden />
      </ToolbarButton>
    </div>
  );
};
