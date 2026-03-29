/** Minimal shape for React `ClipboardEvent` and DOM `ClipboardEvent`. */
export type ClipboardDataEvent = {
  clipboardData: DataTransfer | null;
};

/**
 * Clipboard paste often exposes images on `clipboardData.items` (not always on `files`).
 * Use this for paste handlers that upload images.
 */
export function getClipboardImageFiles(event: ClipboardDataEvent): File[] {
  const out: File[] = [];
  const items = event.clipboardData?.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) out.push(f);
      }
    }
  }
  if (out.length === 0 && event.clipboardData?.files?.length) {
    for (const f of Array.from(event.clipboardData.files)) {
      if (f.type.startsWith('image/')) out.push(f);
    }
  }
  return out;
}
