import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transcribeImage, transcribeAudio } from './transcribeService.js';

const mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

describe('transcribeService', () => {
  const apiKey = 'test-api-key';

  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  describe('transcribeImage', () => {
    it('calls Gemini with image part and returns transcribed text', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Hello from image',
        },
      });

      const buffer = Buffer.from('fake-image-data');
      const result = await transcribeImage(buffer, 'image/png', apiKey);

      expect(result).toBe('Hello from image');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      const call = mockGenerateContent.mock.calls[0][0];
      expect(call).toHaveLength(2);
      expect(call[0]).toHaveProperty('text');
      expect(call[1]).toMatchObject({
        inlineData: {
          mimeType: 'image/png',
          data: buffer.toString('base64'),
        },
      });
    });

    it('returns trimmed empty string when response is empty', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '  ',
        },
      });

      const result = await transcribeImage(Buffer.from('x'), 'image/jpeg', apiKey);
      expect(result).toBe('');
    });
  });

  describe('transcribeAudio', () => {
    it('calls Gemini with audio part and returns transcribed text', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Hello from audio',
        },
      });

      const buffer = Buffer.from('fake-audio-data');
      const result = await transcribeAudio(buffer, 'audio/mp3', apiKey);

      expect(result).toBe('Hello from audio');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      const call = mockGenerateContent.mock.calls[0][0];
      expect(call).toHaveLength(2);
      expect(call[0]).toHaveProperty('text');
      expect(call[1]).toMatchObject({
        inlineData: {
          mimeType: 'audio/mp3',
          data: buffer.toString('base64'),
        },
      });
    });
  });
});
