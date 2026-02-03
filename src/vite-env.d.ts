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
declare const __BUILD_VERSION__: string; // Full version: MAJOR.MINOR.PATCH+BUILD
declare const __BUILD_DATE__: string;
