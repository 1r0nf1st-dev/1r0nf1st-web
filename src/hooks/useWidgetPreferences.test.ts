import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWidgetPreferences } from './useWidgetPreferences';

const STORAGE_KEY = 'notes-home-widgets';

describe('useWidgetPreferences', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('returns default widgets (tasks, strava, goals)', () => {
    const { result } = renderHook(() => useWidgetPreferences());
    expect(result.current.enabledWidgets).toEqual(['tasks', 'strava', 'goals']);
    expect(result.current.isEnabled('tasks')).toBe(true);
    expect(result.current.isEnabled('strava')).toBe(true);
    expect(result.current.isEnabled('goals')).toBe(true);
  });

  it('toggles widget off and on', () => {
    const { result } = renderHook(() => useWidgetPreferences());

    act(() => {
      result.current.toggleWidget('strava');
    });
    expect(result.current.enabledWidgets).toEqual(['tasks', 'goals']);
    expect(result.current.isEnabled('strava')).toBe(false);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual(['tasks', 'goals']);

    act(() => {
      result.current.toggleWidget('strava');
    });
    expect(result.current.enabledWidgets).toContain('strava');
    expect(result.current.isEnabled('strava')).toBe(true);
  });

  it('loads saved preferences from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['strava']));
    const { result } = renderHook(() => useWidgetPreferences());
    expect(result.current.enabledWidgets).toEqual(['strava', 'goals']);
    expect(result.current.isEnabled('tasks')).toBe(false);
    expect(result.current.isEnabled('strava')).toBe(true);
    expect(result.current.isEnabled('goals')).toBe(true);
  });
});
