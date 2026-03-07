import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecordAndTranscribe } from './useRecordAndTranscribe';
import * as apiClient from '../apiClient';

const mockStream = {
  getTracks: () => [{ stop: vi.fn() }],
} as unknown as MediaStream;

function createMockRecorder(mimeType = 'audio/webm') {
  let _ondataavailable: (e: BlobEvent) => void = () => {};
  let _onstop: () => void = () => {};
  return {
    mimeType,
    state: 'recording' as const,
    get ondataavailable() {
      return _ondataavailable;
    },
    set ondataavailable(fn: (e: BlobEvent) => void) {
      _ondataavailable = fn;
    },
    get onstop() {
      return _onstop;
    },
    set onstop(fn: () => void) {
      _onstop = fn;
    },
    start: vi.fn(),
    stop: vi.fn(() => {
      const blob = new Blob(['audio'], { type: mimeType });
      _ondataavailable?.({ data: blob } as BlobEvent);
      _onstop?.();
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    requestData: vi.fn(),
  };
}

describe('useRecordAndTranscribe', () => {
  const originalMediaRecorder = global.MediaRecorder;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiClient, 'postFormData').mockResolvedValue({ text: 'Transcribed text' });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      writable: true,
      configurable: true,
    });
    const mockRecorder = createMockRecorder();
    vi.stubGlobal('MediaRecorder', vi.fn(() => mockRecorder));
    (MediaRecorder as unknown as { isTypeSupported: () => boolean }).isTypeSupported =
      vi.fn().mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('MediaRecorder', originalMediaRecorder);
  });

  it('returns supported false when MediaRecorder is unavailable', () => {
    vi.stubGlobal('MediaRecorder', undefined);
    const { result } = renderHook(() => useRecordAndTranscribe());
    expect(result.current.supported).toBe(false);
  });

  it('returns supported false when getUserMedia is unavailable', () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const { result } = renderHook(() => useRecordAndTranscribe());
    expect(result.current.supported).toBe(false);
  });

  it('returns supported true when MediaRecorder and getUserMedia are available', () => {
    const { result } = renderHook(() => useRecordAndTranscribe());
    expect(result.current.supported).toBe(true);
  });

  it('startRecording requests mic and sets isRecording', async () => {
    const { result } = renderHook(() => useRecordAndTranscribe());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(result.current.isRecording).toBe(true);
  });

  it('stopRecording stops recorder and returns transcribed text', async () => {
    const mockRecorder = createMockRecorder() as unknown as MediaRecorder;
    vi.mocked(global.MediaRecorder).mockImplementation(() => mockRecorder);

    const { result } = renderHook(() => useRecordAndTranscribe());

    await act(async () => {
      await result.current.startRecording();
    });

    let text: string;
    await act(async () => {
      text = await result.current.stopRecording();
    });

    expect(text!).toBe('Transcribed text');
    expect(apiClient.postFormData).toHaveBeenCalledWith(
      '/api/notes/transcribe/audio',
      expect.any(FormData),
    );
    expect(result.current.isRecording).toBe(false);
  });

  it('startRecording sets error on permission denied', async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
      new DOMException('Permission denied', 'NotAllowedError'),
    );

    const { result } = renderHook(() => useRecordAndTranscribe());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.error).toContain('denied');
  });

  it('clearError clears the error state', async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
      new Error('Test error'),
    );

    const { result } = renderHook(() => useRecordAndTranscribe());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
