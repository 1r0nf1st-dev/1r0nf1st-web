import type { JSX } from 'react';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import {
  Mic,
  MicOff,
  FileText,
  FileAudio,
  List,
  ListOrdered,
  Link as LinkIcon,
  CheckSquare,
  Table as TableIcon,
  Image as ImageIcon,
  Loader2,
  Undo2,
  Redo2,
} from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useAlert } from '../contexts/AlertContext';
import { postFormData } from '../apiClient';
import { Tooltip } from './Tooltip';
import { MobileToolbar } from './MobileToolbar';
import { MobileTableControls } from './MobileTableControls';
import { useMediaQuery } from '../hooks/useMediaQuery';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Typography } from '@tiptap/extension-typography';
import { Focus } from '@tiptap/extension-focus';
import {
  btnToolbar,
  btnToolbarActive,
  btnToolbarInactive,
  btnToolbarSm,
} from '../styles/buttons';

function NoteLinkDropdown({
  notes,
  onSelect,
  btnToolbar,
  btnToolbarInactive,
}: {
  notes: Array<{ id: string; title: string }>;
  onSelect: (note: { id: string; title: string }) => void;
  btnToolbar: string;
  btnToolbarInactive: string;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  const filtered = query.trim()
    ? notes.filter(
        (n) =>
          (n.title || '').toLowerCase().includes(query.toLowerCase()) ||
          n.id.toLowerCase().includes(query.toLowerCase()),
      )
    : notes.slice(0, 12);

  return (
    <div ref={ref} className="relative">
      <Tooltip content="Link to note">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`${btnToolbar} ${btnToolbarInactive}`}
          aria-label="Link to note"
          aria-expanded={open}
        >
          <LinkIcon className="w-4 h-4" aria-hidden />
        </button>
      </Tooltip>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-64 max-h-64 overflow-auto rounded-xl border border-primary/20 dark:border-border bg-white dark:bg-surface shadow-lg p-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full px-2 py-1 mb-2 text-sm border border-primary/20 dark:border-border rounded-xl bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <div className="flex flex-col gap-0.5">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted px-2 py-2">No notes found</p>
            ) : (
              filtered.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    onSelect(n);
                    setOpen(false);
                  }}
                  className="text-left px-2 py-1.5 text-sm rounded-xl hover:bg-primary/10 dark:hover:bg-primary/20 truncate"
                >
                  {n.title || 'Untitled'}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export interface NoteEditorProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  placeholder?: string;
  editable?: boolean;
  /** Notes for "Link to note" picker; when provided, shows link-to-note button */
  notesForLinking?: Array<{ id: string; title: string }>;
}

export const NoteEditor = ({
  content,
  onChange,
  placeholder = 'Start writing...',
  editable = true,
  notesForLinking,
}: NoteEditorProps): JSX.Element => {
  const { showAlert } = useAlert();
  const { isListening, error, isSupported, start, stop } = useSpeechToText();
  const [ocrLoading, setOcrLoading] = useState(false);
  const [audioTranscribeLoading, setAudioTranscribeLoading] = useState(false);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (error) {
      showAlert(error);
    }
  }, [error, showAlert]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Exclude Link from StarterKit since we'll add it separately with custom config
        link: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
    ],
    content: content && Object.keys(content).length > 0 ? content : { type: 'doc', content: [] },
    editable,
    onUpdate: ({ editor }) => {
      try {
        const json = editor.getJSON();
        // Ensure document always has valid structure
        if (json && json.type === 'doc') {
          onChange(json);
        } else {
          onChange({ type: 'doc', content: [] });
        }
      } catch (error) {
        console.error('Error updating editor content:', error);
        // Fallback to empty document
        onChange({ type: 'doc', content: [] });
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] p-4 text-foreground',
      },
    },
    onTransaction: ({ editor, transaction }) => {
      // Prevent invalid document states
      if (transaction.steps.length > 0) {
        try {
          const doc = editor.state.doc;
          // Ensure document is always valid
          if (!doc || doc.type.name !== 'doc') {
            editor.commands.setContent({ type: 'doc', content: [] });
          }
        } catch (error) {
          console.error('Error in transaction:', error);
          // Reset to valid empty document
          editor.commands.setContent({ type: 'doc', content: [] });
        }
      }
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (!editor) return;

    // Normalize content: handle null, undefined, empty object, or invalid content
    let normalizedContent: Record<string, unknown>;
    if (!content || typeof content !== 'object' || Object.keys(content).length === 0) {
      normalizedContent = { type: 'doc', content: [] };
    } else {
      // Ensure it has the proper TipTap document structure
      if (content.type === 'doc' && Array.isArray(content.content)) {
        normalizedContent = content;
      } else {
        // If content exists but isn't in TipTap format, wrap it
        normalizedContent = { type: 'doc', content: [] };
      }
    }

    const currentContent = editor.getJSON();

    // Only update if content actually changed to avoid unnecessary updates
    if (JSON.stringify(currentContent) !== JSON.stringify(normalizedContent)) {
      editor.commands.setContent(normalizedContent);
    }
  }, [editor, content]);

  const handleOcrFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !editor) return;
      if (!file.type.startsWith('image/')) {
        showAlert('Please select an image file (PNG, JPG, etc.).');
        return;
      }
      setOcrLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await postFormData<{ text: string }>(
          '/api/notes/transcribe/image',
          formData,
        );
        if (res.text) {
          editor.chain().focus().insertContent(res.text).run();
        } else {
          showAlert('No text could be extracted from this image.');
        }
      } catch (err) {
        showAlert(err instanceof Error ? err.message : 'OCR failed. Please try another image.');
      } finally {
        setOcrLoading(false);
      }
    },
    [editor, showAlert],
  );

  const handleAudioFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !editor) return;
      if (!file.type.startsWith('audio/')) {
        showAlert('Please select an audio file (MP3, WAV, OGG, etc.).');
        return;
      }
      setAudioTranscribeLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await postFormData<{ text: string }>(
          '/api/notes/transcribe/audio',
          formData,
        );
        if (res.text) {
          editor.chain().focus().insertContent(res.text).run();
        } else {
          showAlert('No text could be extracted from this audio.');
        }
      } catch (err) {
        showAlert(
          err instanceof Error ? err.message : 'Transcription failed. Please try another file.',
        );
      } finally {
        setAudioTranscribeLoading(false);
      }
    },
    [editor, showAlert],
  );

  if (!editor) {
    return (
      <div
        className="border-2 border-primary/40 dark:border-border rounded-xl bg-white dark:bg-surface overflow-hidden p-6"
        aria-busy
      >
        <div
          className="h-4 w-full mb-4 animate-pulse rounded-xl bg-muted/40 dark:bg-muted/30"
          role="status"
          aria-label="Loading"
        />
        <div
          className="h-4 w-3/4 mb-4 animate-pulse rounded-xl bg-muted/40 dark:bg-muted/30"
          role="status"
          aria-label="Loading"
        />
        <div
          className="h-32 w-full animate-pulse rounded-xl bg-muted/40 dark:bg-muted/30"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div className="border-2 border-primary/40 dark:border-border rounded-xl bg-white dark:bg-surface overflow-hidden">
      {editable && (
        <>
          {/* Mobile toolbar */}
          {isMobile && editor && (
            <MobileToolbar
              editor={editor}
              notesForLinking={notesForLinking}
              onLinkToNote={(note) => {
                const href = `/notes/${note.id}`;
                const text = note.title || 'Untitled';
                const hasSelection = editor.state.selection.empty === false;
                if (hasSelection) {
                  editor.chain().focus().setLink({ href }).run();
                } else {
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text,
                          marks: [{ type: 'link', attrs: { href } }],
                        },
                      ],
                    })
                    .run();
                }
              }}
              isListening={isListening}
              onToggleSpeech={() => {
                if (!isSupported) {
                  showAlert('Speech recognition is not supported in this browser. Try Chrome or Edge.');
                  return;
                }
                if (isListening) {
                  const text = stop();
                  if (text) {
                    editor.chain().focus().insertContent(text).run();
                  }
                } else {
                  start();
                }
              }}
              ocrLoading={ocrLoading}
              onOcrClick={() => ocrInputRef.current?.click()}
              audioTranscribeLoading={audioTranscribeLoading}
              onAudioTranscribeClick={() => audioInputRef.current?.click()}
            />
          )}
          {/* Desktop toolbar */}
          <div className={`border-b border-primary/20 dark:border-border p-2 bg-gray-50 dark:bg-surface-soft ${isMobile ? 'hidden' : 'overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent'}`}>
            <div className="flex items-center gap-2 min-w-max">
          <Tooltip content="Bold (Ctrl+B)">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={`${btnToolbar} ${
                editor.isActive('bold') ? btnToolbarActive : btnToolbarInactive
              }`}
              aria-label="Bold"
            >
              <strong>B</strong>
            </button>
          </Tooltip>
          <Tooltip content="Italic (Ctrl+I)">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={`${btnToolbar} ${
                editor.isActive('italic') ? btnToolbarActive : btnToolbarInactive
              }`}
              aria-label="Italic"
            >
              <em>I</em>
            </button>
          </Tooltip>
          <Tooltip content="Bullet List">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`${btnToolbar} ${
                editor.isActive('bulletList') ? btnToolbarActive : btnToolbarInactive
              }`}
              aria-label="Bullet List"
            >
              •
            </button>
          </Tooltip>
          <Tooltip content="Numbered List">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`${btnToolbar} ${
                editor.isActive('orderedList') ? btnToolbarActive : btnToolbarInactive
              }`}
              aria-label="Numbered List"
            >
              1.
            </button>
          </Tooltip>
          <Tooltip content="Add Link (Ctrl+K)">
            <button
              type="button"
              onClick={() => {
                const url = window.prompt('Enter URL:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              className={`${btnToolbar} ${
                editor.isActive('link') ? btnToolbarActive : btnToolbarInactive
              }`}
              aria-label="Add Link"
            >
              Link
            </button>
          </Tooltip>
          {notesForLinking && notesForLinking.length > 0 && (
            <NoteLinkDropdown
              notes={notesForLinking}
              onSelect={(note) => {
                const href = `/notes/${note.id}`;
                const text = note.title || 'Untitled';
                const hasSelection = editor.state.selection.empty === false;
                if (hasSelection) {
                  editor.chain().focus().setLink({ href }).run();
                } else {
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text,
                          marks: [{ type: 'link', attrs: { href } }],
                        },
                      ],
                    })
                    .run();
                }
              }}
              btnToolbar={btnToolbar}
              btnToolbarInactive={btnToolbarInactive}
            />
          )}
          <Tooltip content="Highlight">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`${btnToolbar} ${
                editor.isActive('highlight') ? btnToolbarActive : btnToolbarInactive
              }`}
              aria-label="Highlight"
            >
              <span className="bg-yellow-300 px-1">H</span>
            </button>
          </Tooltip>
          <Tooltip content="Task List">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={`${btnToolbar} ${
                editor.isActive('taskList') ? btnToolbarActive : btnToolbarInactive
              }`}
              aria-label="Task List"
            >
              <CheckSquare className="w-4 h-4" aria-hidden />
            </button>
          </Tooltip>
          <Tooltip content="Insert Table">
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
              className={`${btnToolbar} ${btnToolbarInactive}`}
              aria-label="Insert Table"
            >
              <TableIcon className="w-4 h-4" aria-hidden />
            </button>
          </Tooltip>
          {editor.isActive('table') && (
            <>
              <Tooltip content="Add Column Before">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                  disabled={!editor.can().addColumnBefore()}
                  className="px-2 py-1 rounded-xl text-xs font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
                >
                  +C
                </button>
              </Tooltip>
              <Tooltip content="Add Column After">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  disabled={!editor.can().addColumnAfter()}
                  className="px-2 py-1 rounded-xl text-xs font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
                >
                  C+
                </button>
              </Tooltip>
              <Tooltip content="Delete Column">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  disabled={!editor.can().deleteColumn()}
                  className="px-2 py-1 rounded-xl text-xs font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
                >
                  -C
                </button>
              </Tooltip>
              <Tooltip content="Add Row Before">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  disabled={!editor.can().addRowBefore()}
                  className="px-2 py-1 rounded-xl text-xs font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
                >
                  +R
                </button>
              </Tooltip>
              <Tooltip content="Add Row After">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  disabled={!editor.can().addRowAfter()}
                  className="px-2 py-1 rounded-xl text-xs font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
                >
                  R+
                </button>
              </Tooltip>
              <Tooltip content="Delete Row">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  disabled={!editor.can().deleteRow()}
                  className="px-2 py-1 rounded-xl text-xs font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
                >
                  -R
                </button>
              </Tooltip>
              <Tooltip content="Delete Table">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  disabled={!editor.can().deleteTable()}
                  className="px-2 py-1 rounded-xl text-xs font-medium transition-colors bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 disabled:opacity-50"
                >
                  ×
                </button>
              </Tooltip>
            </>
          )}
          <Tooltip content="Insert Image">
            <button
              type="button"
              onClick={() => {
                const url = window.prompt('Enter image URL:');
                if (url) {
                  editor.chain().focus().setImage({ src: url }).run();
                }
              }}
              className={`${btnToolbar} ${btnToolbarInactive}`}
              aria-label="Insert Image"
            >
              <ImageIcon className="w-4 h-4" aria-hidden />
            </button>
          </Tooltip>
          <Tooltip content="Extract text from image (OCR)">
            <span className="inline-block">
              <input
                ref={ocrInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-hidden
                onChange={handleOcrFileChange}
              />
              <button
                type="button"
                onClick={() => ocrInputRef.current?.click()}
                disabled={ocrLoading}
                className={`${btnToolbar} ${btnToolbarInactive}`}
                aria-label="Extract text from image"
                aria-busy={ocrLoading}
              >
                {ocrLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                ) : (
                  <FileText className="w-4 h-4" aria-hidden />
                )}
              </button>
            </span>
          </Tooltip>
          <Tooltip content="Transcribe audio file">
            <span className="inline-block">
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                aria-hidden
                onChange={handleAudioFileChange}
              />
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                disabled={audioTranscribeLoading}
                className={`${btnToolbar} ${btnToolbarInactive}`}
                aria-label="Transcribe audio file"
                aria-busy={audioTranscribeLoading}
              >
                {audioTranscribeLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                ) : (
                  <FileAudio className="w-4 h-4" aria-hidden />
                )}
              </button>
            </span>
          </Tooltip>
          <Tooltip content={isListening ? 'Stop voice input' : 'Voice input (speech to text)'}>
            <button
              type="button"
              onClick={() => {
                if (!isSupported) {
                  showAlert('Speech recognition is not supported in this browser. Try Chrome or Edge.');
                  return;
                }
                if (isListening) {
                  const text = stop();
                  if (text) {
                    editor.chain().focus().insertContent(text).run();
                  }
                } else {
                  start();
                }
              }}
              className={`${btnToolbar} ${isListening ? btnToolbarActive : btnToolbarInactive}`}
              aria-label={isListening ? 'Stop voice input' : 'Voice input'}
              aria-pressed={isListening}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" aria-hidden />
              ) : (
                <Mic className="w-4 h-4" aria-hidden />
              )}
            </button>
          </Tooltip>
          <div className="border-l border-primary/20 dark:border-border mx-1" />
          <Tooltip content="Undo (Ctrl+Z)">
            <button
              type="button"
              onClick={() => {
                try {
                  if (editor.can().undo()) {
                    editor.chain().focus().undo().run();
                  }
                } catch (error) {
                  console.error('Error undoing:', error);
                  // Reset to valid empty document if undo fails
                  editor.commands.setContent({ type: 'doc', content: [] });
                }
              }}
              disabled={!editor.can().undo()}
              className={`${btnToolbar} ${btnToolbarInactive}`}
              aria-label="Undo"
            >
              <Undo2 className="w-4 h-4" aria-hidden />
            </button>
          </Tooltip>
          <Tooltip content="Redo (Ctrl+Y)">
            <button
              type="button"
              onClick={() => {
                try {
                  if (editor.can().redo()) {
                    editor.chain().focus().redo().run();
                  }
                } catch (error) {
                  console.error('Error redoing:', error);
                  // Reset to valid empty document if redo fails
                  editor.commands.setContent({ type: 'doc', content: [] });
                }
              }}
              disabled={!editor.can().redo()}
              className={`${btnToolbar} ${btnToolbarInactive}`}
              aria-label="Redo"
            >
              <Redo2 className="w-4 h-4" aria-hidden />
            </button>
          </Tooltip>
            </div>
          </div>
        </>
      )}
      <EditorContent editor={editor} />
      {editable && <MobileTableControls editor={editor} />}
    </div>
  );
};
