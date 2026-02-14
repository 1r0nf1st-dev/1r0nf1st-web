import { Router } from 'express';
import multer from 'multer';
import type { AuthRequest } from '../middleware/auth.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNotesByUserId,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  searchNotes,
  getNotebooksByUserId,
  getNotebookById,
  createNotebook,
  updateNotebook,
  deleteNotebook,
  getTagsByUserId,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  getAttachmentsByNoteId,
  createAttachment,
  deleteAttachment,
  getNoteVersions,
  getNoteVersion,
  restoreNoteVersion,
  addShareToNoteHistory,
  shareNoteWithUser,
  getNoteShares,
  getSharedNotes,
  getSharedNoteByToken,
  updateSharePermission,
  unshareNote,
} from '../services/noteService.js';
import {
  sanitizeFreeText,
  sanitizePlainText,
  sanitizeFileName,
  isSafeStoragePath,
  isAllowedMimeType,
  hasDangerousExtension,
} from '../utils/sanitize.js';
import { sendTransactionalEmail } from '../services/brevoService.js';
import { config } from '../config.js';

const notesRouter = Router();
const NOTE_TITLE_MAX_LENGTH = 2000;
const NOTE_SEARCH_MAX_LENGTH = 500;
const NOTEBOOK_NAME_MAX_LENGTH = 200;
const TAG_NAME_MAX_LENGTH = 100;

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// All routes require authentication
notesRouter.use(authenticateToken);

// ========== Notes Routes ==========

// GET /api/notes/shared - Get notes shared with current user (must be before /:id)
notesRouter.get('/shared', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const notes = await getSharedNotes(req.userId);
    res.json(notes);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch shared notes';
    res.status(500).json({ error: message });
  }
});

// GET /api/notes/shared/:token - Get note via public share token (no auth required)
notesRouter.get('/shared/:token', async (req, res) => {
  try {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    const note = await getSharedNoteByToken(token);

    if (!note) {
      res.status(404).json({ error: 'Share link not found or expired' });
      return;
    }

    res.json(note);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch shared note';
    res.status(500).json({ error: message });
  }
});

// GET /api/notes - List notes (with filters: ?notebook_id=...&tag_id=...&search=...&archived=true&pinned=true)
notesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const filters = {
      notebook_id: typeof req.query.notebook_id === 'string' ? req.query.notebook_id : undefined,
      tag_id: typeof req.query.tag_id === 'string' ? req.query.tag_id : undefined,
      search:
        typeof req.query.search === 'string'
          ? sanitizePlainText(req.query.search, NOTE_SEARCH_MAX_LENGTH)
          : undefined,
      archived:
        typeof req.query.archived === 'string' ? req.query.archived === 'true' : undefined,
      pinned: typeof req.query.pinned === 'string' ? req.query.pinned === 'true' : undefined,
    };

    const { logger } = await import('../utils/logger.js');
    logger.debug(
      {
        userId: req.userId,
        filters,
        tagId: filters.tag_id,
      },
      'Fetching notes with filters',
    );

    const notes = await getNotesByUserId(req.userId, filters);
    res.json(notes);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notes';
    res.status(500).json({ error: message });
  }
});

// GET /api/notes/search?q=... - Full-text search
notesRouter.get('/search', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const query = sanitizePlainText(
      typeof req.query.q === 'string' ? req.query.q : '',
      NOTE_SEARCH_MAX_LENGTH,
    );
    if (!query.trim()) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const notes = await searchNotes(req.userId, query);
    res.json(notes);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search notes';
    res.status(500).json({ error: message });
  }
});

// ========== Notebooks Routes (must be before /:id route) ==========

// GET /api/notes/notebooks - List notebooks
notesRouter.get('/notebooks', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const notebooks = await getNotebooksByUserId(req.userId);
    res.json(notebooks);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notebooks';
    res.status(500).json({ error: message });
  }
});

// GET /api/notes/notebooks/:id - Get single notebook
notesRouter.get('/notebooks/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const notebookId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const notebook = await getNotebookById(notebookId, req.userId);
    if (!notebook) {
      res.status(404).json({ error: 'Notebook not found' });
      return;
    }

    res.json(notebook);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notebook';
    res.status(500).json({ error: message });
  }
});

// POST /api/notes/notebooks - Create notebook
notesRouter.post('/notebooks', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { name, parent_id, color } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const notebook = await createNotebook(req.userId, {
      name: sanitizeFreeText(name.trim(), NOTEBOOK_NAME_MAX_LENGTH),
      parent_id,
      color,
    });

    res.status(201).json(notebook);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create notebook';
    res.status(500).json({ error: message });
  }
});

// PUT /api/notes/notebooks/:id - Update notebook
notesRouter.put('/notebooks/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const notebookId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, parent_id, color } = req.body;

    const notebook = await updateNotebook(notebookId, req.userId, {
      name: name != null && typeof name === 'string' ? sanitizeFreeText(name.trim(), NOTEBOOK_NAME_MAX_LENGTH) : undefined,
      parent_id,
      color,
    });

    res.json(notebook);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update notebook';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// DELETE /api/notes/notebooks/:id - Delete notebook
notesRouter.delete('/notebooks/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const notebookId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteNotebook(notebookId, req.userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete notebook';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// ========== Tags Routes (must be before /:id route) ==========

// GET /api/notes/tags - List tags
notesRouter.get('/tags', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const tags = await getTagsByUserId(req.userId);
    res.json(tags);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tags';
    res.status(500).json({ error: message });
  }
});

// GET /api/notes/tags/:id - Get single tag
notesRouter.get('/tags/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const tagId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const tag = await getTagById(tagId, req.userId);
    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    res.json(tag);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tag';
    res.status(500).json({ error: message });
  }
});

// POST /api/notes/tags - Create tag
notesRouter.post('/tags', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { name, color } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const tag = await createTag(req.userId, {
      name: sanitizeFreeText(name.trim(), TAG_NAME_MAX_LENGTH),
      color,
    });

    res.status(201).json(tag);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create tag';
    const status =
      error instanceof Error && message.includes('already exists') ? 409 : 500;
    res.status(status).json({ error: message });
  }
});

// PUT /api/notes/tags/:id - Update tag
notesRouter.put('/tags/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const tagId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, color } = req.body;

    const tag = await updateTag(tagId, req.userId, {
      name: name != null && typeof name === 'string' ? sanitizeFreeText(name.trim(), TAG_NAME_MAX_LENGTH) : undefined,
      color,
    });

    res.json(tag);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update tag';
    const status =
      error instanceof Error && (message.includes('not found') || message.includes('already exists'))
        ? message.includes('not found')
          ? 404
          : 409
        : 500;
    res.status(status).json({ error: message });
  }
});

// DELETE /api/notes/tags/:id - Delete tag
notesRouter.delete('/tags/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const tagId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteTag(tagId, req.userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete tag';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// GET /api/notes/:id - Get single note with tags/attachments
notesRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const note = await getNoteById(noteId, req.userId);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json(note);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch note';
    res.status(500).json({ error: message });
  }
});

// POST /api/notes - Create note
notesRouter.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { title, content, notebook_id, tag_ids } = req.body;

    const note = await createNote(req.userId, {
      title: typeof title === 'string' ? sanitizeFreeText(title, NOTE_TITLE_MAX_LENGTH) : undefined,
      content,
      notebook_id,
      tag_ids: Array.isArray(tag_ids) ? tag_ids : undefined,
    });

    res.status(201).json(note);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create note';
    res.status(500).json({ error: message });
  }
});

// PUT /api/notes/:id - Update note
notesRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, content, notebook_id, tag_ids, is_pinned, is_archived } = req.body;

    const note = await updateNote(noteId, req.userId, {
      title: typeof title === 'string' ? sanitizeFreeText(title, NOTE_TITLE_MAX_LENGTH) : undefined,
      content,
      notebook_id,
      tag_ids: Array.isArray(tag_ids) ? tag_ids : undefined,
      is_pinned,
      is_archived,
    });

    res.json(note);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update note';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// DELETE /api/notes/:id - Soft delete note
notesRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteNote(noteId, req.userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete note';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// POST /api/notes/:id/restore - Restore deleted note
notesRouter.post('/:id/restore', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const note = await restoreNote(noteId, req.userId);
    res.json(note);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to restore note';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// ========== Note Versions Routes ==========

// GET /api/notes/:id/versions - Get all versions for a note
notesRouter.get('/:id/versions', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const versions = await getNoteVersions(noteId, req.userId);
    res.json(versions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch note versions';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// GET /api/notes/:id/versions/:versionNumber - Get specific version
notesRouter.get('/:id/versions/:versionNumber', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const versionNumberStr = Array.isArray(req.params.versionNumber)
      ? req.params.versionNumber[0]
      : req.params.versionNumber;
    const versionNumber = Number.parseInt(versionNumberStr, 10);

    if (Number.isNaN(versionNumber) || versionNumber < 1) {
      res.status(400).json({ error: 'Invalid version number' });
      return;
    }

    const version = await getNoteVersion(noteId, versionNumber, req.userId);
    if (!version) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }

    res.json(version);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch note version';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// POST /api/notes/:id/versions/:versionNumber/restore - Restore a version
notesRouter.post('/:id/versions/:versionNumber/restore', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const versionNumberStr = Array.isArray(req.params.versionNumber)
      ? req.params.versionNumber[0]
      : req.params.versionNumber;
    const versionNumber = Number.parseInt(versionNumberStr, 10);

    if (Number.isNaN(versionNumber) || versionNumber < 1) {
      res.status(400).json({ error: 'Invalid version number' });
      return;
    }

    const note = await restoreNoteVersion(noteId, versionNumber, req.userId);
    res.json(note);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to restore version';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// ========== Attachments Routes ==========

// GET /api/notes/:id/attachments - Get attachments for a note
notesRouter.get('/:id/attachments', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const attachments = await getAttachmentsByNoteId(noteId, req.userId);
    res.json(attachments);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch attachments';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// POST /api/notes/:id/attachments/upload - Upload file directly (server-side)
notesRouter.post('/:id/attachments/upload', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    if (!isAllowedMimeType(file.mimetype || '')) {
      res.status(400).json({
        error: 'File type not allowed. Allowed: images, PDF, text, CSV, JSON.',
      });
      return;
    }

    const sanitizedFileName = sanitizeFileName(file.originalname);
    if (hasDangerousExtension(sanitizedFileName)) {
      res.status(400).json({ error: 'File type not allowed for security reasons.' });
      return;
    }

    // Verify note belongs to user
    const { getNoteById, createAttachment } = await import('../services/noteService.js');
    const note = await getNoteById(noteId, req.userId);
    if (!note) {
      res.status(404).json({ error: 'Note not found or access denied' });
      return;
    }

    // Generate file path: notes/{userId}/{noteId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const filePath = `notes/${req.userId}/${noteId}/${timestamp}-${sanitizedFileName}`;

    // Upload file directly to Supabase Storage using service role key (bypasses RLS)
    const { supabase } = await import('../db/supabase.js');
    const { logger } = await import('../utils/logger.js');
    if (!supabase) {
      res.status(503).json({ error: 'Storage not configured' });
      return;
    }

    // Log upload attempt for debugging
    logger.debug(
      {
        filePath,
        fileSize: file.size,
        contentType: file.mimetype,
        bucket: 'note-attachments',
      },
      'Attempting to upload file to Supabase Storage',
    );

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('note-attachments')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      logger.error(
        {
          error: uploadError.message,
          code: uploadError.statusCode,
          filePath,
          bucket: 'note-attachments',
        },
        'Failed to upload file to Supabase Storage',
      );
      
      // Provide helpful error message for RLS policy violations
      let errorMessage = `Failed to upload file: ${uploadError.message}`;
      const isRlsOrForbidden =
        uploadError.message.includes('row-level security') ||
        String(uploadError.statusCode) === '403';
      if (isRlsOrForbidden) {
        errorMessage +=
          ' This is likely an RLS issue. Try: (A) Storage → Buckets → note-attachments → disable RLS; ' +
          'or (B) run 012_storage_service_role_policy.sql or 013_storage_service_role_jwt_policy.sql in Supabase SQL Editor. ' +
          'See server/db/migrations/RUN_MIGRATIONS.md.';
      }
      
      res.status(500).json({ error: errorMessage });
      return;
    }

    logger.debug({ filePath, uploadData }, 'File uploaded successfully');

    // Create attachment metadata (use sanitized name for display/storage)
    const attachment = await createAttachment(noteId, req.userId, {
      file_name: sanitizedFileName,
      file_path: filePath,
      file_type: file.mimetype || 'application/octet-stream',
      file_size: file.size,
      mime_type: file.mimetype || undefined,
    });

    res.status(201).json(attachment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload file';
    res.status(500).json({ error: message });
  }
});

// POST /api/notes/:id/attachments - Create attachment metadata after upload
notesRouter.post('/:id/attachments', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    let { file_name, file_path, file_type, file_size, mime_type } = req.body;

    if (!file_name || !file_path || !file_type || file_size === undefined) {
      res.status(400).json({ error: 'file_name, file_path, file_type, and file_size are required' });
      return;
    }

    const expectedPrefix = `notes/${req.userId}/${noteId}/`;
    if (!isSafeStoragePath(String(file_path).trim(), expectedPrefix)) {
      res.status(400).json({ error: 'Invalid file path' });
      return;
    }

    file_name = sanitizeFileName(String(file_name));
    if (hasDangerousExtension(file_name)) {
      res.status(400).json({ error: 'File type not allowed for security reasons.' });
      return;
    }

    if (!isAllowedMimeType(String(file_type))) {
      res.status(400).json({
        error: 'File type not allowed. Allowed: images, PDF, text, CSV, JSON.',
      });
      return;
    }

    const attachment = await createAttachment(noteId, req.userId, {
      file_name,
      file_path: String(file_path).trim(),
      file_type: String(file_type).trim(),
      file_size: Number(file_size),
      mime_type: typeof mime_type === 'string' ? mime_type.trim() : undefined,
    });

    res.status(201).json(attachment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create attachment';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// GET /api/notes/attachments/:id/download - Get signed URL for file download
notesRouter.get('/attachments/:id/download', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const attachmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Get attachment to verify ownership
    const { getNoteById } = await import('../services/noteService.js');
    const { supabase } = await import('../db/supabase.js');
    
    if (!supabase) {
      res.status(503).json({ error: 'Storage not configured' });
      return;
    }

    // Find attachment
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('note_id, file_path, file_name, file_type, mime_type')
      .eq('id', attachmentId)
      .single();

    if (fetchError || !attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Verify user owns the note
    const note = await getNoteById(attachment.note_id, req.userId);
    if (!note) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Generate signed URL for download (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('note-attachments')
      .createSignedUrl(attachment.file_path, 3600);

    if (signedUrlError || !signedUrlData) {
      res.status(500).json({ error: `Failed to create download URL: ${signedUrlError?.message || 'Unknown error'}` });
      return;
    }

    res.json({
      downloadUrl: signedUrlData.signedUrl,
      file_name: attachment.file_name,
      file_type: attachment.file_type,
      mime_type: attachment.mime_type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get download URL';
    res.status(500).json({ error: message });
  }
});

// ========== Note Sharing Routes ==========

// POST /api/notes/:id/share - Share note with user or create public link
notesRouter.post('/:id/share', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { shared_with_user_id, shared_with_user_email, permission, expires_at } = req.body;

    // Validate permission
    if (permission && permission !== 'view' && permission !== 'edit') {
      res.status(400).json({ error: 'Permission must be "view" or "edit"' });
      return;
    }

    const share = await shareNoteWithUser(noteId, req.userId, {
      shared_with_user_id,
      shared_with_user_email,
      permission: permission || 'view',
      expires_at: expires_at || undefined,
    });

    const note = await getNoteById(noteId, req.userId);
    const noteTitle = note?.title?.trim() || 'A note';

    // Send notification email (don't fail share if email fails)
    if (config.brevoApiKey) {
      if (share.shared_with_user_id && share.shared_with_user?.email) {
        const recipientEmail = share.shared_with_user.email;
        const loginUrl = `${config.siteUrl}/login`;
        const notesUrl = `${config.siteUrl}/notes`;
        try {
          await sendTransactionalEmail({
            to: [recipientEmail],
            subject: `You've been given access to a note: ${noteTitle}`,
            message: `Hello,\n\nSomeone has shared a note with you: "${noteTitle}".\n\nTo view it:\n1. Log in at ${loginUrl}\n2. Go to Notes at ${notesUrl}\n3. Open the "Shared" tab to see notes shared with you.\n\nIf you don't have an account yet, sign up at ${loginUrl} to get started.\n\nBest,\n1r0nf1st`,
          });
        } catch (emailErr) {
          const { logger } = await import('../utils/logger.js');
          logger.warn({ err: emailErr, recipientEmail, noteId }, 'Failed to send share notification email');
        }
      } else if (
        !share.shared_with_user_id &&
        shared_with_user_email &&
        typeof shared_with_user_email === 'string' &&
        share.share_token
      ) {
        const recipientEmail = shared_with_user_email.trim();
        const viewLink = `${config.siteUrl}/notes/shared/${share.share_token}`;
        try {
          await sendTransactionalEmail({
            to: [recipientEmail],
            subject: `You've been given access to a note: ${noteTitle}`,
            message: `Hello,\n\nSomeone has shared a note with you: "${noteTitle}".\n\nView it here (no account needed): ${viewLink}\n\nIf you sign up later with this email, you can also see shared notes in the Shared tab at ${config.siteUrl}/notes.\n\nBest,\n1r0nf1st`,
          });
        } catch (emailErr) {
          const { logger } = await import('../utils/logger.js');
          logger.warn({ err: emailErr, recipientEmail, noteId }, 'Failed to send share link email');
        }
      }
    }

    // Add share event to this note's version history (don't fail the share if this fails)
    const recipientLabel =
      share.shared_with_user_id && share.shared_with_user?.email
        ? share.shared_with_user.email
        : typeof shared_with_user_email === 'string' && shared_with_user_email.trim()
          ? `${shared_with_user_email.trim()} (link)`
          : 'public link';
    const viewLink =
      share.share_token ? `${config.siteUrl}/notes/shared/${share.share_token}` : null;
    try {
      await addShareToNoteHistory(noteId, req.userId, {
        recipientLabel,
        permission: share.permission,
        viewLink,
      });
    } catch (historyErr) {
      const { logger } = await import('../utils/logger.js');
      logger.warn({ err: historyErr, noteId, ownerId: req.userId }, 'Failed to add share to note history');
    }

    res.status(201).json(share);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to share note';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// GET /api/notes/:id/shares - Get all shares for a note
notesRouter.get('/:id/shares', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const shares = await getNoteShares(noteId, req.userId);
    res.json(shares);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch note shares';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// PUT /api/notes/shares/:shareId - Update share permission
notesRouter.put('/shares/:shareId', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const shareId = Array.isArray(req.params.shareId) ? req.params.shareId[0] : req.params.shareId;
    const { permission } = req.body;

    if (!permission || (permission !== 'view' && permission !== 'edit')) {
      res.status(400).json({ error: 'Permission must be "view" or "edit"' });
      return;
    }

    const share = await updateSharePermission(shareId, req.userId, permission);
    res.json(share);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update share permission';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// DELETE /api/notes/shares/:shareId - Remove share
notesRouter.delete('/shares/:shareId', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const shareId = Array.isArray(req.params.shareId) ? req.params.shareId[0] : req.params.shareId;
    await unshareNote(shareId, req.userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unshare note';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// DELETE /api/notes/attachments/:id - Delete attachment
notesRouter.delete('/attachments/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const attachmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Get attachment info before deletion to delete file from storage
    const { supabase } = await import('../db/supabase.js');
    const { getNoteById } = await import('../services/noteService.js');
    
    if (supabase) {
      // Get attachment to get file path
      const { data: attachment } = await supabase
        .from('attachments')
        .select('note_id, file_path')
        .eq('id', attachmentId)
        .single();

      if (attachment) {
        // Verify user owns the note before deleting file
        const note = await getNoteById(attachment.note_id, req.userId);
        if (note) {
          // Delete file from storage
          await supabase.storage.from('note-attachments').remove([attachment.file_path]);
        }
      }
    }

    await deleteAttachment(attachmentId, req.userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete attachment';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

export { notesRouter };
