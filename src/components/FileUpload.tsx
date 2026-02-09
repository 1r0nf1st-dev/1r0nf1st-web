import type { JSX } from 'react';
import { useState, useRef } from 'react';
import { uploadAttachment } from '../useAttachments';
import { btnBase, btnPrimary } from '../styles/buttons';

export interface FileUploadProps {
  noteId: string;
  onUploadComplete: () => void;
  onError: (error: string) => void;
}

export const FileUpload = ({
  noteId,
  onUploadComplete,
  onError,
}: FileUploadProps): JSX.Element => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      onError(`File size exceeds 10MB limit. Selected file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadAttachment(noteId, file);
      setUploadProgress(100);
      onUploadComplete();
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to upload file. Please try again.';
      onError(message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
        aria-label="Upload file"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className={`${btnBase} ${btnPrimary} text-sm`}
      >
        {isUploading ? `Uploading... ${uploadProgress}%` : '📎 Attach File'}
      </button>
      {isUploading && (
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};
