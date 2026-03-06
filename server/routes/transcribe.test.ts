import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { transcribeRouter } from './transcribe.js';
import * as transcribeService from '../services/transcribeService.js';
import { config } from '../config.js';

vi.mock('../middleware/auth.js', () => ({
  authenticateToken: (req: express.Request, _res: express.Response, next: () => void) => {
    (req as express.Request & { userId?: string }).userId = 'test-user-id';
    next();
  },
}));

vi.mock('../config.js', () => ({
  config: {
    geminiApiKey: 'test-gemini-key',
  },
}));

vi.mock('../services/transcribeService.js', () => ({
  transcribeImage: vi.fn(),
  transcribeAudio: vi.fn(),
}));

function createApp(): express.Application {
  const app = express();
  app.use('/transcribe', transcribeRouter);
  return app;
}

describe('transcribe routes', () => {
  const app = createApp();

  beforeEach(() => {
    vi.mocked(config).geminiApiKey = 'test-gemini-key';
    vi.mocked(transcribeService.transcribeImage).mockReset();
    vi.mocked(transcribeService.transcribeAudio).mockReset();
  });

  describe('POST /transcribe/image', () => {
    it('returns 503 when GEMINI_API_KEY is not configured', async () => {
      vi.mocked(config).geminiApiKey = '';
      const res = await request(app)
        .post('/transcribe/image')
        .attach('file', Buffer.from('fake'), 'test.png');
      expect(res.status).toBe(503);
      expect(res.body).toMatchObject({ error: 'Transcription not available' });
      expect(transcribeService.transcribeImage).not.toHaveBeenCalled();
    });

    it('returns 400 when no file is uploaded', async () => {
      const res = await request(app).post('/transcribe/image');
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: 'No file uploaded' });
      expect(transcribeService.transcribeImage).not.toHaveBeenCalled();
    });

    it('returns 400 for unsupported image mime type', async () => {
      const res = await request(app)
        .post('/transcribe/image')
        .attach('file', Buffer.from('fake'), { filename: 'test.gif', contentType: 'image/gif' });
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: 'Unsupported file type' });
      expect(transcribeService.transcribeImage).not.toHaveBeenCalled();
    });

    it('returns 200 with transcribed text on success', async () => {
      vi.mocked(transcribeService.transcribeImage).mockResolvedValue('Extracted text');
      const res = await request(app)
        .post('/transcribe/image')
        .attach('file', Buffer.from('fake'), { filename: 'test.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ text: 'Extracted text' });
      expect(transcribeService.transcribeImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        'image/png',
        'test-gemini-key',
      );
    });

    it('returns 500 when transcribeService throws', async () => {
      vi.mocked(transcribeService.transcribeImage).mockRejectedValue(new Error('Gemini error'));
      const res = await request(app)
        .post('/transcribe/image')
        .attach('file', Buffer.from('fake'), { filename: 'test.png', contentType: 'image/png' });
      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({ error: 'Transcription failed' });
    });
  });

  describe('POST /transcribe/audio', () => {
    it('returns 503 when GEMINI_API_KEY is not configured', async () => {
      vi.mocked(config).geminiApiKey = '';
      const res = await request(app)
        .post('/transcribe/audio')
        .attach('file', Buffer.from('fake'), 'test.mp3');
      expect(res.status).toBe(503);
      expect(res.body).toMatchObject({ error: 'Transcription not available' });
      expect(transcribeService.transcribeAudio).not.toHaveBeenCalled();
    });

    it('returns 400 when no file is uploaded', async () => {
      const res = await request(app).post('/transcribe/audio');
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: 'No file uploaded' });
    });

    it('returns 400 for unsupported audio mime type', async () => {
      const res = await request(app)
        .post('/transcribe/audio')
        .attach('file', Buffer.from('fake'), {
          filename: 'test.aiff',
          contentType: 'audio/aiff',
        });
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: 'Unsupported file type' });
      expect(transcribeService.transcribeAudio).not.toHaveBeenCalled();
    });

    it('returns 200 with transcribed text on success', async () => {
      vi.mocked(transcribeService.transcribeAudio).mockResolvedValue('Spoken text');
      const res = await request(app)
        .post('/transcribe/audio')
        .attach('file', Buffer.from('fake'), { filename: 'test.mp3', contentType: 'audio/mp3' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ text: 'Spoken text' });
      expect(transcribeService.transcribeAudio).toHaveBeenCalledWith(
        expect.any(Buffer),
        'audio/mp3',
        'test-gemini-key',
      );
    });
  });
});
