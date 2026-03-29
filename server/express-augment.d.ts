import 'http';

declare module 'http' {
  interface IncomingMessage {
    /** Raw JSON body bytes for POST /api/logs/platform (Vercel x-vercel-signature). */
    rawBody?: Buffer;
  }
}

export {};
