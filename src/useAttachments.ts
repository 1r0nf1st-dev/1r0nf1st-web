import { useState } from 'react';
import { getJson, ApiError } from './apiClient';
import type { Attachment } from './useNotes';

function getApiBase(): string {
  let apiBase = '/api';
  if (import.meta.env.VITE_API_BASE_URL?.trim()) {
    const trimmed = import.meta.env.VITE_API_BASE_URL.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const normalized = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
      apiBase = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
    } else {
      apiBase = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
    }
  }
  return apiBase;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  file_name: string;
  file_type: string;
  mime_type: string | null;
}

// Removed - now using direct server-side upload

export async function getDownloadUrl(attachmentId: string): Promise<DownloadUrlResponse> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${getApiBase()}/notes/attachments/${attachmentId}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let message = text || `Request failed with status ${response.status}`;
    try {
      const json = JSON.parse(text) as { error?: string; message?: string };
      if (typeof json.error === 'string') message = json.error;
      else if (typeof json.message === 'string') message = json.message;
    } catch {
      // keep message as text
    }
    throw new ApiError(message, response.status, `${getApiBase()}/notes/attachments/${attachmentId}/download`);
  }

  return (await response.json()) as DownloadUrlResponse;
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${getApiBase()}/notes/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let message = text || `Request failed with status ${response.status}`;
    try {
      const json = JSON.parse(text) as { error?: string; message?: string };
      if (typeof json.error === 'string') message = json.error;
      else if (typeof json.message === 'string') message = json.message;
    } catch {
      // keep message as text
    }
    throw new ApiError(message, response.status, `${getApiBase()}/notes/attachments/${attachmentId}`);
  }
}

export async function uploadAttachment(noteId: string, file: File): Promise<Attachment> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Upload file directly to server (server uploads to Supabase Storage using service role key)
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${getApiBase()}/notes/${noteId}/attachments/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let message = text || `Request failed with status ${response.status}`;
    try {
      const json = JSON.parse(text) as { error?: string; message?: string };
      if (typeof json.error === 'string') message = json.error;
      else if (typeof json.message === 'string') message = json.message;
    } catch {
      // keep message as text
    }
    throw new ApiError(message, response.status, `${getApiBase()}/notes/${noteId}/attachments/upload`);
  }

  return (await response.json()) as Attachment;
}
