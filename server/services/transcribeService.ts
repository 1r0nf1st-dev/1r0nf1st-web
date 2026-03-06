import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Part } from '@google/generative-ai';

const IMAGE_PROMPT =
  'Transcribe all text from this image of handwritten or printed notes. Return only the text, nothing else.';
const AUDIO_PROMPT = 'Transcribe this audio. Return only the spoken text, nothing else.';

function fileToPart(buffer: Buffer, mimeType: string): Part {
  const base64 = buffer.toString('base64');
  return {
    inlineData: {
      mimeType,
      data: base64,
    },
  };
}

async function transcribeWithGemini(
  buffer: Buffer,
  mimeType: string,
  prompt: string,
  apiKey: string,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const part = fileToPart(buffer, mimeType);
  const result = await model.generateContent([{ text: prompt }, part]);
  const response = result.response;
  const text = response.text();
  return (text || '').trim();
}

/**
 * Transcribe text from an image using Gemini 1.5 Flash.
 */
export async function transcribeImage(
  buffer: Buffer,
  mimeType: string,
  apiKey: string,
): Promise<string> {
  return transcribeWithGemini(buffer, mimeType, IMAGE_PROMPT, apiKey);
}

/**
 * Transcribe text from an audio file using Gemini 1.5 Flash.
 */
export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
  apiKey: string,
): Promise<string> {
  return transcribeWithGemini(buffer, mimeType, AUDIO_PROMPT, apiKey);
}
