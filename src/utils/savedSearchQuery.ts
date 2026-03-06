/**
 * Build a search query string from current filter state.
 * Uses operators: tag:name, notebook:name, is:archived, is:active
 */
export function buildSearchQuery(params: {
  searchText: string;
  notebookId?: string;
  tagId?: string;
  showArchived?: boolean;
  notebooks?: Array<{ id: string; name: string }>;
  tags?: Array<{ id: string; name: string }>;
}): string {
  const parts: string[] = [];

  if (params.showArchived) {
    parts.push('is:archived');
  } else if (params.searchText || params.notebookId || params.tagId) {
    parts.push('is:active');
  }

  if (params.notebookId && params.notebooks) {
    const nb = params.notebooks.find((n) => n.id === params.notebookId);
    if (nb) {
      parts.push(
        nb.name.includes(' ') ? `notebook:"${nb.name}"` : `notebook:${nb.name}`,
      );
    }
  }

  if (params.tagId && params.tags) {
    const tag = params.tags.find((t) => t.id === params.tagId);
    if (tag) {
      parts.push(
        tag.name.includes(' ') ? `tag:"${tag.name}"` : `tag:${tag.name}`,
      );
    }
  }

  if (params.searchText.trim()) {
    parts.push(params.searchText.trim());
  }

  return parts.join(' ').trim();
}

/**
 * Parse is:archived or is:active from a saved search query.
 */
export function parseArchivedFromQuery(query: string): boolean | undefined {
  if (!query || typeof query !== 'string') return undefined;
  if (/\bis:archived\b/i.test(query)) return true;
  if (/\bis:active\b/i.test(query)) return false;
  return undefined;
}
