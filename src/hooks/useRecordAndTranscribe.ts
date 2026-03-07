import { useState, useCallback, useRef } from 'react';
import { postFormData } from '../apiClient';

/**
 * Get best MediaRecorder mime type for the current browser.
 * Safari uses audio/mp4; Chrome/Firefox use audio/webm.
 */
function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'audio/webm'; // fallback; may fail on Safari
}

/**
 * Infer file extension and clean mime for server.
 * Server expects audio/webm, audio/mp4, etc. (no codecs).
 */
function mimeToExtension(mime: string): { mime: string; ext: string } {
  if (mime.startsWith('audio/webm')) return { mime: 'audio/webm', ext: 'webm' };
  if (mime.startsWith('audio/mp4')) return { mime: 'audio/mp4', ext: 'mp4' };
  if (mime.startsWith('audio/ogg')) return { mime: 'audio/ogg', ext: 'ogg' };
  return { mime: 'audio/webm', ext: 'webm' };
}

export interface UseRecordAndTranscribeResult {
  /** Whether recording is in progress */
  isRecording: boolean;
  /** Whether transcription is in progress (after stop) */
  isTranscribing: boolean;
  /** Error message if recording or transcription failed */
  error: string | null;
  /** Whether MediaRecorder and getUserMedia are supported */
  supported: boolean;
  /** Start recording. Requests mic permission on first call. */
  startRecording: () => Promise<void>;
  /** Stop recording and transcribe. Returns transcribed text or throws. */
  stopRecording: () => Promise<string>;
  /** Clear the current error */
  clearError: () => void;
}

export function useRecordAndTranscribe(): UseRecordAndTranscribeResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const supported =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined';

  const clearError = useCallback(() => setError(null), []);

  const startRecording = useCallback(async () => {
    if (!supported) {
      setError('Recording is not supported in this browser.');
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start recording';
      if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
        setError('Microphone access was denied. Please allow microphone access and try again.');
      } else if (msg.includes('NotFoundError')) {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(msg);
      }
    }
  }, [supported]);

  const stopRecording = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;
      const stream = streamRef.current;

      if (!recorder || recorder.state === 'inactive') {
        setIsRecording(false);
        reject(new Error('No active recording'));
        return;
      }

      const mimeType = recorder.mimeType || 'audio/webm';
      const { mime, ext } = mimeToExtension(mimeType);

      recorder.onstop = async () => {
        setIsRecording(false);
        stream?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;

        const chunks = chunksRef.current;
        if (chunks.length === 0) {
          setError('No audio was recorded. Try again.');
          reject(new Error('No audio recorded'));
          return;
        }

        const blob = new Blob(chunks, { type: mime });
        const file = new File([blob], `recording.${ext}`, { type: mime });
        setIsTranscribing(true);
        setError(null);

        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await postFormData<{ text: string }>(
            '/api/notes/transcribe/audio',
            formData,
          );
          setIsTranscribing(false);
          resolve(res.text || '');
        } catch (err) {
          setIsTranscribing(false);
          const msg =
            err instanceof Error ? err.message : 'Transcription failed. Please try again.';
          setError(msg);
          reject(err);
        }
      };

      recorder.stop();
    });
  }, []);

  return {
    isRecording,
    isTranscribing,
    error,
    supported,
    startRecording,
    stopRecording,
    clearError,
  };
}
