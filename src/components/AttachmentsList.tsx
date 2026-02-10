import type { JSX } from 'react';
import { useState } from 'react';
import type { Attachment } from '../useNotes';
import { getDownloadUrl, deleteAttachment } from '../useAttachments';
import { btnBase, btnGhost } from '../styles/buttons';

export interface AttachmentsListProps {
  attachments: Attachment[];
  onDelete: () => void;
}

export const AttachmentsList = ({
  attachments,
  onDelete,
}: AttachmentsListProps): JSX.Element | null => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDownload = async (attachment: Attachment) => {
    setDownloadingId(attachment.id);
    try {
      const { downloadUrl, file_name } = await getDownloadUrl(attachment.id);
      // Open download URL in new tab
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to download file. Please try again.';
      alert(`Failed to download: ${message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    setDeletingId(attachmentId);
    try {
      await deleteAttachment(attachmentId);
      onDelete();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to delete attachment. Please try again.';
      alert(`Failed to delete: ${message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
    return '📎';
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-primary/20 dark:border-border">
      <h3 className="text-sm font-medium mb-2 text-foreground">Attachments</h3>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-surface-soft rounded-lg hover:bg-gray-100 dark:hover:bg-surface transition-colors"
          >
            <button
              type="button"
              onClick={() => handleDownload(attachment)}
              disabled={downloadingId === attachment.id}
              className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors disabled:opacity-50"
            >
              <span className="text-lg">{getFileIcon(attachment.file_type)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {attachment.file_name}
                </div>
                <div className="text-xs text-muted">
                  {formatFileSize(attachment.file_size)}
                  {downloadingId === attachment.id && ' • Downloading...'}
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleDelete(attachment.id)}
              disabled={deletingId === attachment.id}
              className={`${btnBase} ${btnGhost} text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50`}
              aria-label={`Delete ${attachment.file_name}`}
            >
              {deletingId === attachment.id ? '...' : '×'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
