/**
 * TipTap / ProseMirror often inserts pasted images with `blob:` or `file:` URLs.
 * Those URLs are tied to the browsing session and become invalid after save/reload,
 * which causes repeated console errors: "Not allowed to load local resource: blob:...".
 * This helper replaces such images with inline placeholder text so the doc stays valid.
 */

export type TipTapJSON = Record<string, unknown>;

function isEphemeralImageSrc(src: unknown): boolean {
  if (typeof src !== 'string' || !src) return false;
  return src.startsWith('blob:') || src.startsWith('file:');
}

function transformContentNodes(
  nodes: unknown[],
  preserveEphemeralSrcs?: ReadonlySet<string>,
): unknown[] {
  const out: unknown[] = [];
  for (const raw of nodes) {
    if (!raw || typeof raw !== 'object') continue;
    const node = raw as TipTapJSON;

    if (node.type === 'image') {
      const src = node.attrs && (node.attrs as TipTapJSON).src;
      if (
        isEphemeralImageSrc(src) &&
        (typeof src !== 'string' || !preserveEphemeralSrcs?.has(src))
      ) {
        out.push({
          type: 'text',
          text: ' [Pasted image — use Insert Image with a URL or attach a file to keep it.] ',
          marks: [{ type: 'italic' }],
        });
        continue;
      }
    }

    if (Array.isArray(node.content)) {
      out.push({
        ...node,
        content: transformContentNodes(node.content as unknown[], preserveEphemeralSrcs),
      });
    } else {
      out.push(node);
    }
  }
  return out;
}

/**
 * Returns a deep-cloned doc with blob:/file: images replaced by placeholder text.
 * @param preserveEphemeralSrcs Optional blob:/file: URLs to keep (e.g. queued paste uploads before note save).
 */
export function stripEphemeralImagesFromTipTapDoc(
  doc: TipTapJSON,
  preserveEphemeralSrcs?: ReadonlySet<string>,
): TipTapJSON {
  if (!doc || doc.type !== 'doc') return doc;
  const content = doc.content;
  if (!Array.isArray(content)) return doc;
  return {
    ...doc,
    content: transformContentNodes(content, preserveEphemeralSrcs),
  };
}

/** True if serialized doc likely contains pasted blob URLs (cheap guard before full walk). */
export function tipTapDocMayContainEphemeralImages(doc: TipTapJSON): boolean {
  try {
    const s = JSON.stringify(doc);
    return s.includes('blob:') || s.includes('file:');
  } catch {
    return false;
  }
}
