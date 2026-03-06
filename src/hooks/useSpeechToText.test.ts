import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useSpeechToText } from './useSpeechToText';

const mockRecognition = {
  continuous: false,
  interimResults: false,
  lang: '',
  onresult: null as ((event: SpeechRecognitionEvent) => void) | null,
  onerror: null as ((event: { error: string }) => void) | null,
  onend: null as (() => void) | null,
  start: vi.fn(),
  stop: vi.fn(),
};

describe('useSpeechToText', () => {
  const originalSpeechRecognition = window.SpeechRecognition;
  const originalWebkit = (window as unknown as { webkitSpeechRecognition?: unknown })
    .webkitSpeechRecognition;

  beforeEach(() => {
    const MockSpeechRecognition = vi.fn(() => mockRecognition);
    Object.defineProperty(window, 'SpeechRecognition', {
      value: MockSpeechRecognition,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'SpeechRecognition', {
      value: originalSpeechRecognition,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: originalWebkit,
      writable: true,
      configurable: true,
    });
  });

  it('returns isSupported true when SpeechRecognition is available', () => {
    const { result } = renderHook(() => useSpeechToText());
    expect(result.current.isSupported).toBe(true);
  });

  it('returns isSupported false when SpeechRecognition is unavailable', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    const { result } = renderHook(() => useSpeechToText());
    expect(result.current.isSupported).toBe(false);
  });

  it('start() begins recognition and stop() returns transcript', async () => {
    const { result } = renderHook(() => useSpeechToText());

    act(() => {
      result.current.start();
    });

    expect(mockRecognition.start).toHaveBeenCalled();
    expect(result.current.isListening).toBe(true);

    // Simulate a final result
    act(() => {
      const mockResult = {
        isFinal: true,
        0: { transcript: 'Hello world' },
        length: 1,
        item: () => ({}),
      } as unknown as SpeechRecognitionResult;
      mockRecognition.onresult?.({
        resultIndex: 0,
        results: [mockResult] as unknown as SpeechRecognitionResultList,
      } as SpeechRecognitionEvent);
    });

    let transcript: string;
    act(() => {
      transcript = result.current.stop();
    });
    expect(transcript!).toBe('Hello world');
    expect(result.current.isListening).toBe(false);
  });

  it('reset clears transcript and error', () => {
    const { result } = renderHook(() => useSpeechToText());
    act(() => {
      result.current.start();
    });
    act(() => {
      const mockResult = {
        isFinal: true,
        0: { transcript: 'Test' },
        length: 1,
        item: () => ({}),
      } as unknown as SpeechRecognitionResult;
      mockRecognition.onresult?.({
        resultIndex: 0,
        results: [mockResult] as unknown as SpeechRecognitionResultList,
      } as SpeechRecognitionEvent);
    });
    act(() => result.current.stop());

    expect(result.current.transcript).toBe('Test');
    act(() => result.current.reset());
    expect(result.current.transcript).toBe('');
    expect(result.current.error).toBeNull();
  });
});
