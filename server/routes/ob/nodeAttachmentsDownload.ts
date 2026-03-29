import { Router } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { getObNodeAttachmentForUser } from '../../services/obNodeAttachmentService.js';
import { logger } from '../../utils/logger.js';

const obNodeAttachmentsDownloadRouter = Router();
obNodeAttachmentsDownloadRouter.use(authenticateToken);
obNodeAttachmentsDownloadRouter.use(requireAdmin);

/** GET /api/ob/node-attachments/:id/download — signed URL for pasted image (owner only). */
obNodeAttachmentsDownloadRouter.get('/node-attachments/:id/download', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      res.status(400).json({ error: 'Attachment id required' });
      return;
    }

    const attachment = await getObNodeAttachmentForUser(req.supabase, id, req.userId);
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    const { data: signedUrlData, error: signedUrlError } = await req.supabase.storage
      .from('note-attachments')
      .createSignedUrl(attachment.file_path, 3600);

    if (signedUrlError || !signedUrlData) {
      logger.warn({ err: signedUrlError?.message }, 'OB node attachment signed URL failed');
      res.status(500).json({
        error: `Failed to create download URL: ${signedUrlError?.message || 'Unknown error'}`,
      });
      return;
    }

    res.json({
      downloadUrl: signedUrlData.signedUrl,
      file_name: attachment.file_name,
      mime_type: attachment.mime_type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed';
    res.status(500).json({ error: message });
  }
});

export { obNodeAttachmentsDownloadRouter };
