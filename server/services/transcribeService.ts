import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, unlinkSync, rmdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ffmpegStatic from 'ffmpeg-static';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Part } from '@google/generative-ai';

/** MIME types Gemini accepts for inline audio. MediaRecorder outputs webm/mp4 which may not be supported. */
const GEMINI_AUDIO_MIMES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'] as const;

/** Convert audio/webm or audio/mp4 to MP3 for Gemini compatibility. */
async function convertToMp3(buffer: Buffer, mime: string): Promise<Buffer> {
  const ffmpeg = ffmpegStatic;
  if (!ffmpeg || typeof ffmpeg !== 'string') {
    throw new Error('ffmpeg is not available. Install ffmpeg-static.');
  }
  const ext = mime.includes('mp4') ? 'mp4' : 'webm';
  const tmpDir = mkdtempSync(join(tmpdir(), 'transcribe-'));
  const inputPath = join(tmpDir, `input.${ext}`);
  const outputPath = join(tmpDir, 'output.mp3');
  try {
    writeFileSync(inputPath, buffer);
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpeg, ['-i', inputPath, '-vn', '-acodec', 'libmp3lame', '-y', outputPath]);
      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
    });
    return readFileSync(outputPath);
  } finally {
    try {
      unlinkSync(inputPath);
    } catch {
      /* ignore */
    }
    try {
      unlinkSync(outputPath);
    } catch {
      /* ignore */
    }
    try {
      rmdirSync(tmpDir);
    } catch {
      /* ignore */
    }
  }
}

async function ensureGeminiCompatibleAudio(
  buffer: Buffer,
  mimeType: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const norm = mimeType.split(';')[0].trim().toLowerCase();
  if (GEMINI_AUDIO_MIMES.includes(norm as (typeof GEMINI_AUDIO_MIMES)[number])) {
    return { buffer, mimeType: norm };
  }
  if (norm === 'audio/webm' || norm === 'audio/mp4') {
    try {
      const mp3 = await convertToMp3(buffer, norm);
      return { buffer: mp3, mimeType: 'audio/mpeg' };
    } catch (conversionErr) {
      const msg =
        conversionErr instanceof Error
          ? conversionErr.message
          : 'Conversion failed';
      if (msg.includes('ffmpeg') || msg.includes('exited with code')) {
        throw new Error(
          `Audio conversion failed: ${msg}. Try "Transcribe audio file" with an MP3 or WAV file instead.`,
        );
      }
      throw conversionErr;
    }
  }
  return { buffer, mimeType: norm };
}

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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const part = fileToPart(buffer, mimeType);
  const result = await model.generateContent([{ text: prompt }, part]);
  const response = result.response;
  const text = response.text();
  return (text || '').trim();
}

/**
 * Transcribe text from an image using Gemini 2.5 Flash.
 */
export async function transcribeImage(
  buffer: Buffer,
  mimeType: string,
  apiKey: string,
): Promise<string> {
  return transcribeWithGemini(buffer, mimeType, IMAGE_PROMPT, apiKey);
}

/**
 * Transcribe text from an audio file using Gemini 2.5 Flash.
 * Converts audio/webm and audio/mp4 (MediaRecorder) to MP3 before sending to Gemini.
 */
export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
  apiKey: string,
): Promise<string> {
  const { buffer: compatibleBuffer, mimeType: compatibleMime } =
    await ensureGeminiCompatibleAudio(buffer, mimeType);
  return transcribeWithGemini(
    compatibleBuffer,
    compatibleMime,
    AUDIO_PROMPT,
    apiKey,
  );
}
