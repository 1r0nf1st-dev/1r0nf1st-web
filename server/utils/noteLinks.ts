/**
 * Extract note IDs from TipTap content that link to other notes.
 * Links use href="/notes/{noteId}" or relative "/notes/{noteId}".
 */
/** Matches /notes/{uuid} in href - internal note links */
const NOTE_LINK_REGEX = /\/notes\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

function extractFromMarks(marks: unknown[]): string[] {
  if (!Array.isArray(marks)) return [];
  const ids: string[] = [];
  for (const m of marks) {
    if (m && typeof m === 'object' && 'type' in m && (m as { type: string }).type === 'link') {
      const attrs = (m as { attrs?: { href?: string } }).attrs;
      const href = attrs?.href;
      if (typeof href === 'string' && href.includes('/notes/')) {
        const matches = [...href.matchAll(NOTE_LINK_REGEX)];
        for (const match of matches) {
          if (match[1]) ids.push(match[1].toLowerCase());
        }
      }
    }
  }
  return ids;
}

function traverseNode(node: unknown, collected: Set<string>): void {
  if (!node || typeof node !== 'object') return;

  const obj = node as Record<string, unknown>;

  if (obj.marks && Array.isArray(obj.marks)) {
    const ids = extractFromMarks(obj.marks);
    ids.forEach((id) => collected.add(id));
  }

  if (obj.content && Array.isArray(obj.content)) {
    for (const child of obj.content) {
      traverseNode(child, collected);
    }
  }
}

/**
 * Extract unique note IDs that are linked from the given TipTap content.
 */
export function extractNoteIdsFromContent(content: unknown): string[] {
  if (!content || typeof content !== 'object') return [];
  const collected = new Set<string>();
  traverseNode(content, collected);
  return Array.from(collected);
}
