import type { JSX } from 'react';
import type { ChangeEvent } from 'react';
import type { Editor as TipTapEditor } from '@tiptap/react';
import { useCallback, useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import {
  Bold,
  Italic,
  Highlighter,
  Mic,
  MicOff,
  FileText,
  FileAudio,
  ListOrdered,
  Link as LinkIcon,
  CheckSquare,
  Table as TableIcon,
  Image as ImageIcon,
  Loader2,
  Undo2,
  Redo2,
  Circle,
} from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useRecordAndTranscribe } from '../hooks/useRecordAndTranscribe';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { postFormData } from '../apiClient';
import { Tooltip } from './Tooltip';
import { MobileToolbar } from './MobileToolbar';
import { MobileTableControls } from './MobileTableControls';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { getDownloadUrl, uploadAttachment } from '../useAttachments';
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
import { btnToolbar, btnToolbarActive, btnToolbarInactive } from '../styles/buttons';
import { stripEphemeralImagesFromTipTapDoc, type TipTapJSON } from '../utils/sanitizeTipTapDoc';

type QueuedPastedImage = { file: File; blobUrl: string };

function replaceImageSrcInDocument(
  editor: TipTapEditor,
  oldSrc: string,
  newSrc: string,
  alt?: string,
): boolean {
  const { state } = editor;
  const { tr } = state;
  let modified = false;
  state.doc.descendants((node, pos) => {
    if (node.type.name !== 'image') return;
    const src = node.attrs.src as string | undefined;
    if (src !== oldSrc) return;
    tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      src: newSrc,
      alt: alt ?? (node.attrs.alt as string) ?? '',
    });
    modified = true;
  });
  if (modified) {
    editor.view.dispatch(tr);
  }
  return modified;
}

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
          className={`tool-btn ${btnToolbar} ${btnToolbarInactive}`}
          aria-label="Link to note"
          aria-expanded={open}
        >
          <LinkIcon className="size-4 shrink-0" aria-hidden />
        </button>
      </Tooltip>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-64 max-h-64 overflow-auto rounded-none border border-[rgba(255,255,255,0.11)] bg-[#2a2520] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full px-2 py-1 mb-2 text-sm border border-[rgba(255,255,255,0.11)] rounded-none bg-[#1a1714] text-[#f4f2ee] placeholder:text-[#5c574f] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#e05c1a]"
          />
          <div className="flex flex-col gap-0.5">
            {filtered.length === 0 ? (
              <p className="text-sm text-[#a8a39a] px-2 py-2">No notes found</p>
            ) : (
              filtered.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    onSelect(n);
                    setOpen(false);
                  }}
                  className="text-left px-2 py-1.5 text-sm rounded-none text-[#f4f2ee] hover:bg-[#333028] truncate"
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
  noteId?: string;
  /** Increment after a successful save to retry any failed queued paste uploads (same noteId). */
  pasteFlushKey?: number;
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  placeholder?: string;
  editable?: boolean;
  /** Notes for "Link to note" picker; when provided, shows link-to-note button */
  notesForLinking?: Array<{ id: string; title: string }>;
}

export const NoteEditor = ({
  noteId,
  pasteFlushKey = 0,
  content,
  onChange,
  placeholder = 'Start writing...',
  editable = true,
  notesForLinking,
}: NoteEditorProps): JSX.Element => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const isAdmin = !!user?.email && user.email.toLowerCase() === 'admin@1r0nf1st.com';
  const { isListening, error, isSupported, start, stop } = useSpeechToText();
  const {
    isRecording,
    isTranscribing,
    error: recordError,
    supported: recordSupported,
    startRecording,
    stopRecording,
    clearError: clearRecordError,
  } = useRecordAndTranscribe();
  const [ocrLoading, setOcrLoading] = useState(false);
  const [audioTranscribeLoading, setAudioTranscribeLoading] = useState(false);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<TipTapEditor | null>(null);
  const noteIdRef = useRef(noteId);
  noteIdRef.current = noteId;
  const pasteQueueRef = useRef<QueuedPastedImage[]>([]);
  const flushInFlightRef = useRef(false);
  const prevNoteIdForPasteQueueRef = useRef<string | undefined>(undefined);
  const handlePastedImageFilesRef = useRef<(files: File[]) => Promise<void>>(async () => {});
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const prev = prevNoteIdForPasteQueueRef.current;
    const next = noteId;
    if (prev !== undefined && next !== prev) {
      for (const item of pasteQueueRef.current) {
        URL.revokeObjectURL(item.blobUrl);
      }
      pasteQueueRef.current = [];
    }
    prevNoteIdForPasteQueueRef.current = next;
  }, [noteId]);

  const flushPasteQueue = useCallback(
    async (targetNoteId: string) => {
      const ed = editorRef.current;
      if (!ed || flushInFlightRef.current || pasteQueueRef.current.length === 0) return;
      flushInFlightRef.current = true;
      try {
        while (pasteQueueRef.current.length > 0) {
          const item = pasteQueueRef.current[0];
          try {
            const attachment = await uploadAttachment(targetNoteId, item.file);
            const { downloadUrl } = await getDownloadUrl(attachment.id);
            replaceImageSrcInDocument(ed, item.blobUrl, downloadUrl, item.file.name);
            URL.revokeObjectURL(item.blobUrl);
            pasteQueueRef.current.shift();
          } catch (err) {
            showAlert(
              err instanceof Error ? err.message : 'Failed to upload pasted image from queue.',
            );
            break;
          }
        }
      } finally {
        flushInFlightRef.current = false;
      }
    },
    [showAlert],
  );

  const handlePastedImageFiles = useCallback(
    async (files: File[]) => {
      const ed = editorRef.current;
      if (!ed) return;
      const currentNoteId = noteIdRef.current;
      if (currentNoteId) {
        for (const file of files) {
          try {
            const attachment = await uploadAttachment(currentNoteId, file);
            const { downloadUrl } = await getDownloadUrl(attachment.id);
            ed.chain().focus().setImage({ src: downloadUrl, alt: file.name }).run();
          } catch (err) {
            showAlert(err instanceof Error ? err.message : 'Failed to upload pasted image.');
          }
        }
      } else {
        for (const file of files) {
          const blobUrl = URL.createObjectURL(file);
          pasteQueueRef.current.push({ file, blobUrl });
          ed.chain().focus().setImage({ src: blobUrl, alt: file.name }).run();
        }
      }
    },
    [showAlert],
  );

  useLayoutEffect(() => {
    handlePastedImageFilesRef.current = handlePastedImageFiles;
  }, [handlePastedImageFiles]);

  useEffect(() => {
    if (error) {
      showAlert(error);
    }
  }, [error, showAlert]);

  useEffect(() => {
    if (recordError) {
      showAlert(recordError);
      clearRecordError();
    }
  }, [recordError, showAlert, clearRecordError]);

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
    onCreate: ({ editor }) => {
      editorRef.current = editor;
    },
    onDestroy: () => {
      editorRef.current = null;
    },
    onUpdate: ({ editor }) => {
      try {
        const json = editor.getJSON();
        const preserveEphemeralSrcs = new Set(
          pasteQueueRef.current.map((q) => q.blobUrl),
        );
        if (json && json.type === 'doc') {
          onChange(
            stripEphemeralImagesFromTipTapDoc(
              json as TipTapJSON,
              preserveEphemeralSrcs,
            ) as Record<string, unknown>,
          );
        } else {
          onChange({ type: 'doc', content: [] });
        }
      } catch (error) {
        console.error('Error updating editor content:', error);
        onChange({ type: 'doc', content: [] });
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] p-4 text-foreground',
      },
      handlePaste: (_view, event) => {
        const imageFiles = Array.from(event.clipboardData?.files ?? []).filter((file) =>
          file.type.startsWith('image/'),
        );
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        void handlePastedImageFilesRef.current(imageFiles);
        return true;
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

  useEffect(() => {
    if (!noteId || !editor) return;
    void flushPasteQueue(noteId);
  }, [noteId, editor, flushPasteQueue, pasteFlushKey]);

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
        const preserveBlobSrcs = new Set(
          pasteQueueRef.current.map((q) => q.blobUrl),
        );
        normalizedContent = stripEphemeralImagesFromTipTapDoc(
          content as TipTapJSON,
          preserveBlobSrcs,
        ) as Record<string, unknown>;
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
    async (e: ChangeEvent<HTMLInputElement>) => {
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
        const res = await postFormData<{ text: string }>('/api/notes/transcribe/image', formData);
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
    async (e: ChangeEvent<HTMLInputElement>) => {
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
        const res = await postFormData<{ text: string }>('/api/notes/transcribe/audio', formData);
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

  const handleRecordAndTranscribeToggle = useCallback(async () => {
    if (!editor) return;
    if (!recordSupported) {
      showAlert('Recording is not supported in this browser.');
      return;
    }
    if (isRecording) {
      try {
        const text = await stopRecording();
        if (text) {
          editor.chain().focus().insertContent(text).run();
        } else {
          showAlert('No speech detected. Try recording again.');
        }
      } catch {
        // Error already shown via recordError
      }
    } else {
      await startRecording();
    }
  }, [editor, recordSupported, isRecording, startRecording, stopRecording, showAlert]);

  if (!editor) {
    return (
      <div className="editor-wrapper rounded-xl overflow-hidden p-6" aria-busy>
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
    <div className="editor-wrapper rounded-xl overflow-hidden">
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
                  showAlert(
                    'Speech recognition is not supported in this browser. Try Chrome or Edge.',
                  );
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
              ocrLoading={isAdmin ? ocrLoading : false}
              onOcrClick={isAdmin ? () => ocrInputRef.current?.click() : undefined}
              audioTranscribeLoading={isAdmin ? audioTranscribeLoading : false}
              onAudioTranscribeClick={isAdmin ? () => audioInputRef.current?.click() : undefined}
              isRecordAndTranscribeRecording={isRecording}
              recordAndTranscribeLoading={isTranscribing}
              onRecordAndTranscribeToggle={isAdmin ? handleRecordAndTranscribeToggle : undefined}
              recordAndTranscribeSupported={isAdmin && recordSupported}
            />
          )}
          {/* Desktop toolbar */}
          <div
            className={`editor-toolbar border-b border-[rgba(255,255,255,0.11)] p-2 ${isMobile ? 'hidden' : 'overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent'}`}
          >
            <div className="flex items-center gap-2 min-w-max">
              <Tooltip content="Bold (Ctrl+B)">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  disabled={!editor.can().chain().focus().toggleBold().run()}
                  className={`tool-btn ${btnToolbar} ${
                    editor.isActive('bold') ? 'is-active ' + btnToolbarActive : btnToolbarInactive
                  }`}
                  aria-label="Bold"
                >
                  <Bold className="size-4 shrink-0" aria-hidden />
                </button>
              </Tooltip>
              <Tooltip content="Italic (Ctrl+I)">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  disabled={!editor.can().chain().focus().toggleItalic().run()}
                  className={`tool-btn ${btnToolbar} ${
                    editor.isActive('italic') ? 'is-active ' + btnToolbarActive : btnToolbarInactive
                  }`}
                  aria-label="Italic"
                >
                  <Italic className="size-4 shrink-0" aria-hidden />
                </button>
              </Tooltip>
              <Tooltip content="Bullet List">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`tool-btn ${btnToolbar} ${
                    editor.isActive('bulletList')
                      ? 'is-active ' + btnToolbarActive
                      : btnToolbarInactive
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
                  className={`tool-btn ${btnToolbar} ${
                    editor.isActive('orderedList')
                      ? 'is-active ' + btnToolbarActive
                      : btnToolbarInactive
                  }`}
                  aria-label="Numbered List"
                >
                  <ListOrdered className="size-4 shrink-0" aria-hidden />
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
                  className={`tool-btn tool-btn-text ${btnToolbar} ${
                    editor.isActive('link') ? 'is-active ' + btnToolbarActive : btnToolbarInactive
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
                  className={`tool-btn ${btnToolbar} ${
                    editor.isActive('highlight')
                      ? 'is-active ' + btnToolbarActive
                      : btnToolbarInactive
                  }`}
                  aria-label="Highlight"
                >
                  <Highlighter className="size-4 shrink-0" aria-hidden />
                </button>
              </Tooltip>
              <Tooltip content="Task List">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleTaskList().run()}
                  className={`tool-btn ${btnToolbar} ${
                    editor.isActive('taskList')
                      ? 'is-active ' + btnToolbarActive
                      : btnToolbarInactive
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
                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                      .run()
                  }
                  className={`tool-btn ${btnToolbar} ${btnToolbarInactive}`}
                  aria-label="Insert Table"
                >
                  <TableIcon className="size-4 shrink-0" aria-hidden />
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
                  className={`tool-btn ${btnToolbar} ${btnToolbarInactive}`}
                  aria-label="Insert Image"
                >
                  <ImageIcon className="size-4 shrink-0" aria-hidden />
                </button>
              </Tooltip>
              {isAdmin && (
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
                      className={`tool-btn ${btnToolbar} ${btnToolbarInactive}`}
                      aria-label="Extract text from image"
                      aria-busy={ocrLoading}
                    >
                      {ocrLoading ? (
                        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                      ) : (
                        <FileText className="size-4 shrink-0" aria-hidden />
                      )}
                    </button>
                  </span>
                </Tooltip>
              )}
              {isAdmin && (
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
                      className={`tool-btn ${btnToolbar} ${btnToolbarInactive}`}
                      aria-label="Transcribe audio file"
                      aria-busy={audioTranscribeLoading}
                    >
                      {audioTranscribeLoading ? (
                        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                      ) : (
                        <FileAudio className="w-4 h-4" aria-hidden />
                      )}
                    </button>
                  </span>
                </Tooltip>
              )}
              {isAdmin && (
                <Tooltip
                  content={
                    isRecording
                      ? 'Stop recording and transcribe'
                      : isTranscribing
                        ? 'Transcribing...'
                        : 'Record & transcribe (same quality as file upload)'
                  }
                >
                  <button
                    type="button"
                    onClick={handleRecordAndTranscribeToggle}
                    disabled={!recordSupported || isTranscribing}
                    className={`tool-btn ${btnToolbar} ${
                      isRecording ? 'is-active ' + btnToolbarActive : btnToolbarInactive
                    }`}
                    aria-label={
                      isRecording ? 'Stop recording and transcribe' : 'Record and transcribe'
                    }
                    aria-pressed={isRecording}
                    aria-busy={isTranscribing}
                  >
                    {isTranscribing ? (
                      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                    ) : isRecording ? (
                      <Circle className="size-4 shrink-0 fill-red-500 text-red-500" aria-hidden />
                    ) : (
                      <FileAudio className="w-4 h-4" aria-hidden />
                    )}
                  </button>
                </Tooltip>
              )}
              <Tooltip content={isListening ? 'Stop voice input' : 'Voice input (speech to text)'}>
                <button
                  type="button"
                  onClick={() => {
                    if (!isSupported) {
                      showAlert(
                        'Speech recognition is not supported in this browser. Try Chrome or Edge.',
                      );
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
                  className={`tool-btn ${btnToolbar} ${
                    isListening ? 'is-active ' + btnToolbarActive : btnToolbarInactive
                  }`}
                  aria-label={isListening ? 'Stop voice input' : 'Voice input'}
                  aria-pressed={isListening}
                >
                  {isListening ? (
                    <MicOff className="size-4 shrink-0" aria-hidden />
                  ) : (
                    <Mic className="w-4 h-4" aria-hidden />
                  )}
                </button>
              </Tooltip>
              <div className="tool-divider border-l border-primary/20 dark:border-border mx-1" />
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
                  className={`tool-btn ${btnToolbar} ${btnToolbarInactive}`}
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
                  className={`tool-btn ${btnToolbar} ${btnToolbarInactive}`}
                  aria-label="Redo"
                >
                  <Redo2 className="size-4 shrink-0" aria-hidden />
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
