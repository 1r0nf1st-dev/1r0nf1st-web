export interface EnvConfig {
  apiBaseUrl: string;
}

export const env: EnvConfig = {
  // Use relative URL in development (Vite proxy handles it) or absolute URL in production
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
};
