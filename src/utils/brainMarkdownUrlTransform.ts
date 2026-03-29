import { defaultUrlTransform } from 'react-markdown';
import { OB_ATTACH_PREFIX, SB_ATTACH_PREFIX } from '../lib/brainPasteImage';

/** UUID v4 (and common variants) after our attach prefix — blocks junk after `:`. */
const ATTACH_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isBrainAttachMarkdownUrl(url: string): boolean {
  const u = url.trim();
  if (u.startsWith(OB_ATTACH_PREFIX)) {
    return ATTACH_ID_RE.test(u.slice(OB_ATTACH_PREFIX.length));
  }
  if (u.startsWith(SB_ATTACH_PREFIX)) {
    return ATTACH_ID_RE.test(u.slice(SB_ATTACH_PREFIX.length));
  }
  return false;
}

/**
 * react-markdown's defaultUrlTransform only allows a few schemes; it clears `ob-attach:` / `sb-attach:`.
 * Pass this as `urlTransform` wherever we render user markdown that may contain those image refs.
 */
export function brainMarkdownUrlTransform(url: string): string {
  if (isBrainAttachMarkdownUrl(url)) return url.trim();
  return defaultUrlTransform(url);
}
