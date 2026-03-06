import { useState, useCallback, useRef, useEffect } from 'react';

type SpeechRecognitionConstructor = (new () => SpeechRecognition) | undefined;

function getSpeechRecognitionAPI(): SpeechRecognitionConstructor {
  if (typeof window === 'undefined') return undefined;
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

export function useSpeechToText(): {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  start: () => void;
  stop: () => string;
  reset: () => void;
} {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef('');

  const isSupported = !!getSpeechRecognitionAPI();

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
    transcriptRef.current = '';
  }, []);

  const stop = useCallback((): string => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    return transcriptRef.current;
  }, []);

  const start = useCallback(() => {
    const API = getSpeechRecognitionAPI();
    if (!API) {
      setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    setError(null);
    setTranscript('');
    transcriptRef.current = '';

    const recognition = new API();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const parts: string[] = [];
      for (let i = event.resultIndex; i < results.length; i++) {
        const result = results[i];
        if (result.isFinal && result[0]) {
          parts.push(result[0].transcript);
        }
      }
      if (parts.length > 0) {
        const addition = parts.join(' ');
        const next = (transcriptRef.current ? `${transcriptRef.current} ${addition}` : addition).trim();
        transcriptRef.current = next;
        setTranscript(next);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      if (event.error === 'network') {
        setError('Speech recognition requires internet access. Please check your connection and try again.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied.');
      } else {
        setError(`Error: ${event.error}`);
      }
      stop();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start speech recognition');
      setIsListening(false);
    }
  }, [stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { isListening, transcript, error, isSupported, start, stop, reset };
}
