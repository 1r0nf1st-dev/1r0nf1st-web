'use client';

import type { JSX } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { getJson } from '../../apiClient';
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

/** Columns that should show full text (no truncation), with min-width for readability */
const FULL_TEXT_COLUMNS = new Set([
  'raw_text',
  'body',
  'notes',
  'goal',
  'summary',
  'task',
]);

export const BrowsePanel = (): JSX.Element => {
  const [activeTable, setActiveTable] = useState<TableName>('projects');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [editRawText, setEditRawText] = useState('');
  const [deleteRow, setDeleteRow] = useState<Record<string, unknown> | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    getJson<Record<string, unknown>[]>(
      `/api/second-brain/${activeTable}?limit=50`,
    )
      .then((res) => setData(res ?? []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load'),
      )
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
    const rawText = row
      ? String(row.raw_text ?? '')
      : editRawText;
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
  const columns = data[0]
    ? (Object.keys(data[0]) as string[]).filter((k) => !['embedding'].includes(k))
    : [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Browse</h2>
      <div className="flex flex-wrap gap-2">
        {TABLES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTable(t.id)}
            className={`${btnBase} ${btnGhost} px-3 py-1.5 text-sm ${
              activeTable === t.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading && <p className="text-sm text-muted">Loading…</p>}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && data.length === 0 && (
        <p className="text-sm text-muted">No items yet.</p>
      )}
      {showActions && !loading && !error && data.length > 0 && (
        <p className="rounded-lg border border-border bg-surface-soft/50 px-4 py-3 text-sm text-muted">
          Click <strong>Edit</strong> to change text, <strong>Re-route</strong> to classify and move to the correct box, or <strong>Delete</strong> to remove.
        </p>
      )}
      {showStatusActions && !loading && !error && data.length > 0 && (
        <p className="rounded-lg border border-border bg-surface-soft/50 px-4 py-3 text-sm text-muted">
          Click <strong>Complete</strong> to mark as done, or <strong>Reopen</strong> to move back to active.
        </p>
      )}
      {actionError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {actionError}
        </p>
      )}
      {!loading && !error && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm table-auto">
            <thead>
              <tr className="border-b border-border bg-surface-soft/50">
                {columns.map((k) => (
                  <th
                    key={k}
                    className={`px-4 py-2 text-left font-medium text-foreground ${
                      FULL_TEXT_COLUMNS.has(k)
                        ? 'min-w-[min(400px,90vw)] whitespace-nowrap'
                        : ''
                    }`}
                  >
                    {k}
                  </th>
                ))}
                {(showActions || showStatusActions) && (
                  <th className="px-4 py-2 text-left font-medium text-foreground min-w-[140px]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={(row.id as string) ?? i}
                  className="border-b border-border last:border-0"
                >
                  {columns.map((k) => {
                    const v = row[k];
                    return (
                      <td
                        key={k}
                        className={`px-4 py-2 text-muted align-top ${
                          FULL_TEXT_COLUMNS.has(k)
                            ? 'min-w-[min(400px,90vw)] whitespace-pre-wrap break-words'
                            : 'max-w-[200px] truncate'
                        }`}
                        title={
                          FULL_TEXT_COLUMNS.has(k)
                            ? undefined
                            : String(v ?? '')
                        }
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
                    <td className="px-4 py-2 align-top">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(row)}
                          className={`${btnBase} ${btnGhost} px-2 py-1 text-xs`}
                          disabled={actionLoading}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReroute(row)}
                          className={`${btnBase} ${btnGhost} px-2 py-1 text-xs`}
                          disabled={actionLoading}
                          title="Re-classify and route to correct box"
                        >
                          Re-route
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(row)}
                          className={`${btnBase} ${btnGhost} px-2 py-1 text-xs text-red-600 dark:text-red-400`}
                          disabled={actionLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                  {showStatusActions && !showActions && (
                    <td className="px-4 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(row)}
                        className={`${btnBase} ${btnGhost} px-2 py-1 text-xs`}
                        disabled={actionLoading}
                        title={
                          String(row.status ?? '') === 'done'
                            ? 'Reopen'
                            : 'Mark as complete'
                        }
                      >
                        {String(row.status ?? '') === 'done' ? 'Reopen' : 'Complete'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
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
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border border-border bg-surface p-6 shadow-xl">
            <h3 id="edit-thought-title" className="mb-4 text-lg font-semibold text-foreground">
              Edit thought
            </h3>
            <textarea
              value={editRawText}
              onChange={(e) => setEditRawText(e.target.value)}
              rows={8}
              className="mb-4 w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:ring-2 focus:ring-primary"
              placeholder="Edit raw text…"
              aria-label="Raw text"
            />
            <p className="mb-4 text-xs text-muted">
              Tip: Add a prefix (projects:, people:, ideas:, admin:, resources:) to force category.
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
