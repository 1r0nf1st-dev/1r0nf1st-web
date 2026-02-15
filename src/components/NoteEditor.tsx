import type { JSX } from 'react';
import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Tooltip } from './Tooltip';
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

export interface NoteEditorProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  placeholder?: string;
  editable?: boolean;
}

export const NoteEditor = ({
  content,
  onChange,
  placeholder = 'Start writing...',
  editable = true,
}: NoteEditorProps): JSX.Element => {
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

  if (!editor) {
    return (
      <div className="border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface overflow-hidden p-6" aria-busy>
        <div className="h-4 w-full mb-4 animate-pulse rounded-md bg-muted/40 dark:bg-muted/30" role="status" aria-label="Loading" />
        <div className="h-4 w-3/4 mb-4 animate-pulse rounded-md bg-muted/40 dark:bg-muted/30" role="status" aria-label="Loading" />
        <div className="h-32 w-full animate-pulse rounded-md bg-muted/40 dark:bg-muted/30" role="status" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface overflow-hidden">
      {editable && (
        <div className="border-b border-primary/20 dark:border-border p-2 flex flex-wrap gap-2 bg-gray-50 dark:bg-surface-soft">
          <Tooltip content="Bold (Ctrl+B)">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                editor.isActive('bold')
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft'
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
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                editor.isActive('italic')
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft'
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
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                editor.isActive('bulletList')
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft'
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
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                editor.isActive('orderedList')
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft'
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
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                editor.isActive('link')
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft'
              }`}
              aria-label="Add Link"
            >
              Link
            </button>
          </Tooltip>
          <Tooltip content="Highlight">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                editor.isActive('highlight')
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft'
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
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                editor.isActive('taskList')
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft'
              }`}
              aria-label="Task List"
            >
              ☑
            </button>
          </Tooltip>
          <Tooltip content="Insert Table">
            <button
              type="button"
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="px-3 py-1 rounded text-sm font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft"
              aria-label="Insert Table"
            >
              ⧉
            </button>
          </Tooltip>
          {editor.isActive('table') && (
            <>
              <Tooltip content="Add Column Before">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                  disabled={!editor.can().addColumnBefore()}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
                >
                  +C
                </button>
              </Tooltip>
              <Tooltip content="Add Column After">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  disabled={!editor.can().addColumnAfter()}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
                >
                  C+
                </button>
              </Tooltip>
              <Tooltip content="Delete Column">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  disabled={!editor.can().deleteColumn()}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
                >
                  -C
                </button>
              </Tooltip>
              <Tooltip content="Add Row Before">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  disabled={!editor.can().addRowBefore()}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
                >
                  +R
                </button>
              </Tooltip>
              <Tooltip content="Add Row After">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  disabled={!editor.can().addRowAfter()}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
                >
                  R+
                </button>
              </Tooltip>
              <Tooltip content="Delete Row">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  disabled={!editor.can().deleteRow()}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
                >
                  -R
                </button>
              </Tooltip>
              <Tooltip content="Delete Table">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  disabled={!editor.can().deleteTable()}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 disabled:opacity-50"
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
              className="px-3 py-1 rounded text-sm font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft"
              aria-label="Insert Image"
            >
              🖼
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
              className="px-3 py-1 rounded text-sm font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
              aria-label="Undo"
            >
              ↶
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
              className="px-3 py-1 rounded text-sm font-medium transition-colors bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft disabled:opacity-50"
              aria-label="Redo"
            >
              ↷
            </button>
          </Tooltip>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};
