'use client';

import type { ClipboardEvent, JSX } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Pencil, RotateCcw, Trash2, Wrench } from 'lucide-react';
import { getJson } from '../../apiClient';
import { markdownSbAttachImage, uploadSecondBrainThoughtImage } from '../../lib/brainPasteImage';
import { getClipboardImageFiles } from '../../utils/clipboardImageFiles';
import { btnBase, btnGhost, btnPrimary } from '../../styles/buttons';

type TableName = 'projects' | 'people' | 'ideas' | 'admin' | 'resources' | 'thoughts';

const TABLES: { id: TableName; label: string }[] = [
  { id: 'projects', label: 'Projects' },
  { id: 'people', label: 'People' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'admin', label: 'Tasks' },
  { id: 'resources', label: 'Resources' },
  { id: 'thoughts', label: 'Thoughts (Inbox)' },
];

/** Columns that show full text (no truncation). Constrained width so table doesn't stretch too far. */
const FULL_TEXT_COLUMNS = new Set(['raw_text', 'body', 'notes', 'goal', 'summary', 'task']);

/** Max width for full-text columns to keep table from stretching indefinitely */
const FULL_TEXT_MAX_W = 280;

export const BrowsePanel = (): JSX.Element => {
  const [activeTable, setActiveTable] = useState<TableName>('projects');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [editRawText, setEditRawText] = useState('');
  const [deleteRow, setDeleteRow] = useState<Record<string, unknown> | null>(null);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const menuDropdownRef = useRef<HTMLDivElement | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    getJson<Record<string, unknown>[]>(`/api/second-brain/${activeTable}?limit=50`)
      .then((res) => setData(res ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [activeTable]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (row: Record<string, unknown>): void => {
    setEditRow(row);
    setEditRawText(String(row.raw_text ?? ''));
    setActionError(null);
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editRow?.id || !editRawText.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await getJson<{ id: string }>(`/api/second-brain/thoughts/${editRow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: editRawText.trim() }),
      });
      setEditRow(null);
      fetchData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReroute = async (row?: Record<string, unknown>): Promise<void> => {
    const id = (row?.id ?? editRow?.id) as string | undefined;
    const rawText = row ? String(row.raw_text ?? '') : editRawText;
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await getJson<{ routed: boolean; category: string }>(
        `/api/second-brain/thoughts/${id}/route`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText: rawText.trim() || undefined,
          }),
        },
      );
      setEditRow(null);
      fetchData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to route');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditThoughtPaste = useCallback(
    async (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const thoughtId = editRow?.id as string | undefined;
      if (!thoughtId) return;
      const files = getClipboardImageFiles(e);
      if (files.length === 0) return;
      e.preventDefault();
      const ta = editTextareaRef.current;
      const insertMarkdown = (md: string): void => {
        if (ta) {
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          setEditRawText((v) => v.slice(0, start) + md + v.slice(end));
          requestAnimationFrame(() => {
            ta.focus();
            const pos = start + md.length;
            ta.setSelectionRange(pos, pos);
          });
        } else {
          setEditRawText((v) => (v ? `${v}\n${md}` : md));
        }
      };
      for (const file of files) {
        try {
          const { id } = await uploadSecondBrainThoughtImage(thoughtId, file);
          insertMarkdown(`${markdownSbAttachImage(id)}\n`);
        } catch (err) {
          setActionError(err instanceof Error ? err.message : 'Image upload failed');
        }
      }
    },
    [editRow?.id],
  );

  const handleDeleteClick = (row: Record<string, unknown>): void => {
    setDeleteRow(row);
    setActionError(null);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteRow?.id) return;
    const id = deleteRow.id as string;
    setActionLoading(true);
    setActionError(null);
    try {
      await getJson<undefined>(`/api/second-brain/thoughts/${id}`, {
        method: 'DELETE',
      });
      setDeleteRow(null);
      if (editRow?.id === id) setEditRow(null);
      fetchData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleComplete = async (row: Record<string, unknown>): Promise<void> => {
    const id = row.id as string | undefined;
    if (!id) return;
    if (activeTable === 'projects') {
      const current = String(row.status ?? 'active');
      const next = current === 'done' ? 'active' : 'done';
      setActionLoading(true);
      setActionError(null);
      try {
        await getJson<{ id: string }>(`/api/second-brain/projects/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
        fetchData();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to update');
      } finally {
        setActionLoading(false);
      }
    } else if (activeTable === 'admin') {
      const current = String(row.status ?? 'pending');
      const next = current === 'done' ? 'pending' : 'done';
      setActionLoading(true);
      setActionError(null);
      try {
        await getJson<{ id: string }>(`/api/second-brain/admin/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
        fetchData();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to update');
      } finally {
        setActionLoading(false);
      }
    } else if (activeTable === 'ideas') {
      const current = String(row.status ?? 'raw');
      const next = current === 'done' ? 'raw' : 'done';
      setActionLoading(true);
      setActionError(null);
      try {
        await getJson<{ id: string }>(`/api/second-brain/ideas/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
        fetchData();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to update');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const showActions = activeTable === 'thoughts';
  const showStatusActions =
    activeTable === 'projects' || activeTable === 'admin' || activeTable === 'ideas';
  const hasRowActions = showActions || showStatusActions;

  // Close tool menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as Node;
      const isMenuButton = Array.from(menuButtonRefs.current.values()).some((el) =>
        el?.contains(target),
      );
      const isInsideDropdown = menuDropdownRef.current?.contains(target);
      if (!isMenuButton && !isInsideDropdown && openMenuRowId) {
        setOpenMenuRowId(null);
      }
    };
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpenMenuRowId(null);
    };
    if (openMenuRowId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [openMenuRowId]);

  const columns = data[0]
    ? (Object.keys(data[0]) as string[]).filter((k) => !['embedding'].includes(k))
    : [];

  return (
    <div className="content-panel">
      <h2 className="panel-title">Browse</h2>
      <div className="flex flex-wrap gap-2">
        {TABLES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTable(t.id)}
            className={[
              'px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] border bg-transparent',
              activeTable === t.id
                ? 'border-[color:var(--color-orange)] text-[color:var(--color-orange)]'
                : 'border-[color:var(--color-rule-dark)] text-[color:var(--color-text-inv-2)] hover:border-[color:var(--color-rule-md)]',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading && (
        <p className="font-display text-[12px] text-[color:var(--color-text-3)]">Loading…</p>
      )}
      {error && (
        <p className="font-display text-[12px] text-[color:var(--color-orange)]" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && data.length === 0 && (
        <p className="font-display text-[12px] text-[color:var(--color-text-3)]">No items yet.</p>
      )}
      {showActions && !loading && !error && data.length > 0 && (
        <p className="border border-[color:var(--color-steel-border)] bg-[color:var(--color-steel-bg)] px-4 py-3 font-display text-[12px] text-[color:var(--color-steel)]">
          <span className="font-semibold text-[color:var(--color-text-1)]">Editable:</span> Click
          the pencil icon to edit, or the tool icon for Re-route and Delete.
        </p>
      )}
      {showStatusActions && !loading && !error && data.length > 0 && (
        <p className="border border-[color:var(--color-rule-dark)] bg-[color:var(--color-surface)] px-4 py-3 font-display text-[12px] text-[color:var(--color-text-inv-2)]">
          Click the pencil icon to mark as done or reopen.
        </p>
      )}
      {actionError && (
        <p className="font-display text-[12px] text-[color:var(--color-orange)]" role="alert">
          {actionError}
        </p>
      )}
      {!loading && !error && data.length > 0 && (
        <div className="max-w-full overflow-x-auto border border-[color:var(--color-rule-dark)]">
          <table className="w-full max-w-5xl table-auto font-display text-[12px] text-[color:var(--color-text-inv)]">
            <thead>
              <tr className="border-b border-[color:var(--color-rule-dark)] bg-[color:var(--color-sidebar-bg)]">
                {hasRowActions && (
                  <th className="w-10 px-2 py-2 text-left shrink-0" scope="col" aria-label="Edit" />
                )}
                {columns.map((k) => (
                  <th
                    key={k}
                    className={`px-4 py-2 text-left font-semibold text-[color:var(--color-text-inv)] ${
                      FULL_TEXT_COLUMNS.has(k) ? 'whitespace-nowrap' : ''
                    }`}
                    style={
                      FULL_TEXT_COLUMNS.has(k)
                        ? { minWidth: FULL_TEXT_MAX_W, maxWidth: FULL_TEXT_MAX_W }
                        : undefined
                    }
                  >
                    {k}
                  </th>
                ))}
                {showActions && (
                  <th
                    className="w-10 px-2 py-2 text-left shrink-0"
                    scope="col"
                    aria-label="Options"
                  />
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const rowId = (row.id as string) ?? `row-${i}`;
                const isMenuOpen = openMenuRowId === rowId;
                return (
                  <tr
                    key={rowId}
                    className="border-b border-[color:var(--color-rule)] last:border-0 hover:bg-[color:var(--color-orange-bg)] transition-colors"
                  >
                    {hasRowActions && (
                      <td className="px-2 py-2 align-top shrink-0 w-10">
                        {showActions ? (
                          <button
                            type="button"
                            onClick={() => handleEdit(row)}
                            disabled={actionLoading}
                            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-0 border-0 bg-transparent text-[color:var(--color-text-3)] hover:text-[color:var(--color-orange)] cursor-pointer disabled:opacity-50"
                            title="Edit"
                            aria-label="Edit"
                          >
                            <Pencil className="w-4 h-4" aria-hidden />
                          </button>
                        ) : showStatusActions ? (
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(row)}
                            disabled={actionLoading}
                            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-0 border-0 bg-transparent text-[color:var(--color-text-3)] hover:text-[color:var(--color-orange)] cursor-pointer disabled:opacity-50"
                            title={
                              String(row.status ?? '') === 'done' ? 'Reopen' : 'Mark as complete'
                            }
                            aria-label={
                              String(row.status ?? '') === 'done' ? 'Reopen' : 'Mark complete'
                            }
                          >
                            <Pencil className="w-4 h-4" aria-hidden />
                          </button>
                        ) : null}
                      </td>
                    )}
                    {columns.map((k) => {
                      const v = row[k];
                      return (
                        <td
                          key={k}
                          className={`px-4 py-2 text-[color:var(--color-text-inv-2)] align-top ${
                            FULL_TEXT_COLUMNS.has(k)
                              ? 'whitespace-pre-wrap break-words'
                              : 'max-w-[180px] truncate'
                          }`}
                          style={
                            FULL_TEXT_COLUMNS.has(k)
                              ? { minWidth: FULL_TEXT_MAX_W, maxWidth: FULL_TEXT_MAX_W }
                              : undefined
                          }
                          title={FULL_TEXT_COLUMNS.has(k) ? undefined : String(v ?? '')}
                        >
                          {v === null || v === undefined
                            ? '—'
                            : typeof v === 'object'
                              ? JSON.stringify(v)
                              : String(v)}
                        </td>
                      );
                    })}
                    {showActions && (
                      <td className="px-2 py-2 align-top shrink-0 w-10 relative">
                        <div className="relative">
                          <button
                            ref={(el) => {
                              if (el) menuButtonRefs.current.set(rowId, el);
                            }}
                            type="button"
                            onClick={() => setOpenMenuRowId(isMenuOpen ? null : rowId)}
                            disabled={actionLoading}
                            className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-0 border-0 bg-transparent text-[color:var(--color-text-3)] hover:text-[color:var(--color-text-1)] cursor-pointer disabled:opacity-50 ${
                              isMenuOpen ? 'text-[color:var(--color-text-1)]' : ''
                            }`}
                            title="More options"
                            aria-label="More options"
                            aria-expanded={isMenuOpen}
                          >
                            <Wrench className="w-4 h-4" aria-hidden />
                          </button>
                          {isMenuOpen && (
                            <div
                              ref={menuDropdownRef}
                              role="menu"
                              className="absolute right-0 top-full mt-1 z-50 min-w-[140px] border border-[color:var(--color-rule)] bg-[color:var(--color-white)] shadow-lg py-1"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  handleReroute(row);
                                  setOpenMenuRowId(null);
                                }}
                                disabled={actionLoading}
                                className="w-full flex items-center justify-start gap-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-text-1)] hover:bg-[color:var(--color-orange-bg)]"
                              >
                                <RotateCcw className="w-4 h-4 shrink-0" aria-hidden />
                                Re-route
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  handleDeleteClick(row);
                                  setOpenMenuRowId(null);
                                }}
                                disabled={actionLoading}
                                className="w-full flex items-center justify-start gap-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#E11D48] hover:bg-[rgba(225,29,72,0.08)]"
                              >
                                <Trash2 className="w-4 h-4 shrink-0" aria-hidden />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {editRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-thought-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto border border-[color:var(--color-rule)] bg-[color:var(--color-white)] p-6 shadow-xl">
            <h3
              id="edit-thought-title"
              className="mb-4 font-display text-[14px] font-bold uppercase tracking-[0.06em] text-[color:var(--color-text-1)]"
            >
              Edit thought
            </h3>
            <textarea
              ref={editTextareaRef}
              value={editRawText}
              onChange={(e) => setEditRawText(e.target.value)}
              onPaste={handleEditThoughtPaste}
              rows={8}
              className="mb-4 w-full border border-[color:var(--color-rule)] bg-[color:var(--color-white)] px-3 py-2 font-mono text-[13px] text-[color:var(--color-text-1)] focus:outline-none focus-visible:outline-2 focus-visible:outline-[color:var(--color-orange)] focus-visible:outline-offset-2 rounded-none"
              placeholder="Edit raw text…"
              aria-label="Raw text"
            />
            <p className="mb-4 text-xs text-muted">
              Tip: Paste images to embed <code className="font-mono">sb-attach:…</code> references (stored
              securely). Add a prefix (projects:, people:, ideas:, admin:, resources:) to force category.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={actionLoading || !editRawText.trim()}
                className={`${btnBase} ${btnPrimary}`}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => handleReroute()}
                disabled={actionLoading || !editRawText.trim()}
                className={`${btnBase} ${btnGhost}`}
                title="Re-classify and route to correct box"
              >
                Save &amp; Re-route
              </button>
              <button
                type="button"
                onClick={() => setEditRow(null)}
                disabled={actionLoading}
                className={`${btnBase} ${btnGhost}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-thought-title"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl">
            <h3 id="delete-thought-title" className="mb-4 text-lg font-semibold text-foreground">
              Delete thought?
            </h3>
            <p className="mb-4 text-sm text-muted">
              This will remove the thought from the inbox. This cannot be undone.
            </p>
            <p className="mb-4 max-h-24 overflow-auto rounded border border-border bg-background px-3 py-2 text-sm text-foreground">
              {String(deleteRow.raw_text ?? '').slice(0, 200)}
              {String(deleteRow.raw_text ?? '').length > 200 ? '…' : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className={`${btnBase} bg-red-600 text-white hover:bg-red-700 border-transparent`}
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteRow(null)}
                disabled={actionLoading}
                className={`${btnBase} ${btnGhost}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
