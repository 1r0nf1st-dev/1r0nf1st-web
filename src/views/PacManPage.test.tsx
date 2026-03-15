import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PacManPage } from './PacManPage';
import { ThemeProvider } from '../contexts/ThemeContext';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('PacManPage', () => {
  let rafId: number;
  const rafCalls: FrameRequestCallback[] = [];

  beforeEach(() => {
    rafId = 0;
    rafCalls.length = 0;
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: FrameRequestCallback) => {
        rafCalls.push(cb);
        rafId += 1;
        return rafId;
      }
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the game canvas', () => {
    render(
      <ThemeProvider>
        <PacManPage />
      </ThemeProvider>
    );
    const canvas = screen.getByTestId('pacman-canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders controls hint', () => {
    render(
      <ThemeProvider>
        <PacManPage />
      </ThemeProvider>
    );
    expect(screen.getByText(/arrow keys or wasd/i)).toBeInTheDocument();
  });
});
