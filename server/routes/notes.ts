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
} from '../services/noteService.js';

const notesRouter = Router();

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
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
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

    const query = typeof req.query.q === 'string' ? req.query.q : '';
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
      name: name.trim(),
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
      name: name?.trim(),
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
      name: name.trim(),
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
      name: name?.trim(),
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
      title,
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
      title,
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

    // Verify note belongs to user
    const { getNoteById, createAttachment } = await import('../services/noteService.js');
    const note = await getNoteById(noteId, req.userId);
    if (!note) {
      res.status(404).json({ error: 'Note not found or access denied' });
      return;
    }

    // Generate file path: notes/{userId}/{noteId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
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
      res.status(500).json({ error: `Failed to upload file: ${uploadError.message}` });
      return;
    }

    logger.debug({ filePath, uploadData }, 'File uploaded successfully');

    // Create attachment metadata
    const attachment = await createAttachment(noteId, req.userId, {
      file_name: file.originalname,
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
    const { file_name, file_path, file_type, file_size, mime_type } = req.body;

    if (!file_name || !file_path || !file_type || file_size === undefined) {
      res.status(400).json({ error: 'file_name, file_path, file_type, and file_size are required' });
      return;
    }

    const attachment = await createAttachment(noteId, req.userId, {
      file_name,
      file_path,
      file_type,
      file_size,
      mime_type,
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
