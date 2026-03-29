import { getApiBase } from '../config';
import { postFormData, getJson } from '../apiClient';

/** Markdown image src for Open Brain (resolved in preview via signed URL). */
export const OB_ATTACH_PREFIX = 'ob-attach:';

/** Markdown image src for Second Brain thought raw text. */
export const SB_ATTACH_PREFIX = 'sb-attach:';

export function markdownObAttachImage(attachmentId: string, alt = 'image'): string {
  return `![${alt}](${OB_ATTACH_PREFIX}${attachmentId})`;
}

export function markdownSbAttachImage(attachmentId: string, alt = 'image'): string {
  return `![${alt}](${SB_ATTACH_PREFIX}${attachmentId})`;
}

export async function uploadOpenBrainNodeImage(nodeId: string, file: File): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return postFormData<{ id: string }>(
    `${getApiBase()}/ob/nodes/${encodeURIComponent(nodeId)}/attachments/upload`,
    formData,
  );
}

export async function uploadSecondBrainThoughtImage(
  thoughtId: string,
  file: File,
): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return postFormData<{ id: string }>(
    `${getApiBase()}/second-brain/thoughts/${encodeURIComponent(thoughtId)}/attachments/upload`,
    formData,
  );
}

export async function fetchOpenBrainAttachmentDownloadUrl(
  attachmentId: string,
): Promise<{ downloadUrl: string }> {
  return getJson<{ downloadUrl: string }>(
    `${getApiBase()}/ob/node-attachments/${encodeURIComponent(attachmentId)}/download`,
  );
}

export async function fetchSecondBrainAttachmentDownloadUrl(
  attachmentId: string,
): Promise<{ downloadUrl: string }> {
  return getJson<{ downloadUrl: string }>(
    `${getApiBase()}/second-brain/attachments/${encodeURIComponent(attachmentId)}/download`,
  );
}

export function isObAttachSrc(src: string | undefined): string | null {
  if (!src || !src.startsWith(OB_ATTACH_PREFIX)) return null;
  return src.slice(OB_ATTACH_PREFIX.length);
}

export function isSbAttachSrc(src: string | undefined): string | null {
  if (!src || !src.startsWith(SB_ATTACH_PREFIX)) return null;
  return src.slice(SB_ATTACH_PREFIX.length);
}
