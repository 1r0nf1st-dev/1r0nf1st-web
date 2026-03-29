const STORAGE_KEY = 'app_session_anon_v1';

/**
 * Opaque per-tab session id for log correlation. Not tied to auth or PII.
 */
export function getSessionAnonId(): string | undefined {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return undefined;
  }
  try {
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}
