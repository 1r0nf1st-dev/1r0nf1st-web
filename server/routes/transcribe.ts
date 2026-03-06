import type { Response, NextFunction } from 'express';
import { Router } from 'express';
import multer from 'multer';
import type { AuthRequest } from '../middleware/auth.js';
import { authenticateToken } from '../middleware/auth.js';
import { transcribeImage, transcribeAudio } from '../services/transcribeService.js';
import { config } from '../config.js';

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const AUDIO_MIMES = [
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/mpeg',
  'audio/webm',
] as const;

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
});

const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const transcribeRouter = Router();

function requireGeminiKey(
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!config.geminiApiKey) {
    res.status(503).json({
      error: 'Transcription not available',
      message: 'GEMINI_API_KEY is not configured',
    });
    return;
  }
  next();
}

transcribeRouter.post(
  '/image',
  authenticateToken,
  requireGeminiKey,
  uploadImage.single('file'),
  async (req: AuthRequest & { file?: Express.Multer.File }, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      const mime = req.file.mimetype as string;
      if (!IMAGE_MIMES.includes(mime as (typeof IMAGE_MIMES)[number])) {
        res.status(400).json({
          error: 'Unsupported file type',
          message: `Allowed types: ${IMAGE_MIMES.join(', ')}`,
        });
        return;
      }
      const text = await transcribeImage(
        req.file.buffer,
        mime,
        config.geminiApiKey,
      );
      res.json({ text });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      res.status(500).json({ error: 'Transcription failed', message });
    }
  },
);

transcribeRouter.post(
  '/audio',
  authenticateToken,
  requireGeminiKey,
  uploadAudio.single('file'),
  async (req: AuthRequest & { file?: Express.Multer.File }, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      const mime = req.file.mimetype as string;
      if (!AUDIO_MIMES.includes(mime as (typeof AUDIO_MIMES)[number])) {
        res.status(400).json({
          error: 'Unsupported file type',
          message: `Allowed types: ${AUDIO_MIMES.join(', ')}`,
        });
        return;
      }
      const text = await transcribeAudio(
        req.file.buffer,
        mime,
        config.geminiApiKey,
      );
      res.json({ text });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      res.status(500).json({ error: 'Transcription failed', message });
    }
  },
);

export { transcribeRouter };
