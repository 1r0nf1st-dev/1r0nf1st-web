import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'notes-home-widgets';

export type WidgetId = 'tasks' | 'strava' | 'goals';

const DEFAULT_WIDGETS: WidgetId[] = ['tasks', 'strava', 'goals'];

function loadPreferences(): WidgetId[] {
  if (typeof window === 'undefined') return DEFAULT_WIDGETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_WIDGETS;
    const valid = parsed.filter((id): id is WidgetId =>
      id === 'tasks' || id === 'strava' || id === 'goals',
    );
    const result = valid.length > 0 ? valid : DEFAULT_WIDGETS;
    // Migrate: add 'goals' for users who had pre-goals preferences
    if (!result.includes('goals')) {
      const migrated: WidgetId[] = [...result, 'goals'];
      savePreferences(migrated);
      return migrated;
    }
    return result;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

function savePreferences(ids: WidgetId[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function useWidgetPreferences(): {
  enabledWidgets: WidgetId[];
  toggleWidget: (id: WidgetId) => void;
  isEnabled: (id: WidgetId) => boolean;
} {
  const [enabledWidgets, setEnabledWidgets] = useState<WidgetId[]>(DEFAULT_WIDGETS);

  useEffect(() => {
    setEnabledWidgets(loadPreferences());
  }, []);

  const toggleWidget = useCallback((id: WidgetId) => {
    setEnabledWidgets((prev) => {
      const next = prev.includes(id)
        ? prev.filter((w) => w !== id)
        : [...prev, id];
      savePreferences(next);
      return next;
    });
  }, []);

  const isEnabled = useCallback(
    (id: WidgetId) => enabledWidgets.includes(id),
    [enabledWidgets],
  );

  return { enabledWidgets, toggleWidget, isEnabled };
}
