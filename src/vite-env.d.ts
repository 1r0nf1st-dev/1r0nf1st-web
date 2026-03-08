/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Build-time constants injected by Vite
declare const __VERSION__: string; // MAJOR.MINOR.PATCH from package.json
declare const __BUILD_NUMBER__: string; // Git commit SHA (short) or 'dev'
declare const __BUILD_VERSION__: string; // Full version: MAJOR.MINOR.PATCH.BUILD
declare const __BUILD_DATE__: string;

declare global {
  /** Web Speech API - Speech Recognition (not in lib.dom) */
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
  }
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message?: string;
  }
  interface SpeechRecognitionStatic {
    new (): SpeechRecognition;
  }
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
  /** PWA install prompt (non-standard, Chromium/Edge) */
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    prompt(): Promise<void>;
  }
}

export {};
