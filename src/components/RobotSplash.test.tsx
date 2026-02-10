import type { ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RobotSplash } from './RobotSplash';
import { ThemeProvider } from '../contexts/ThemeContext';

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('RobotSplash', () => {
  it('calls onEnter when Skip to portfolio is clicked', () => {
    const onEnter = vi.fn();
    renderWithTheme(<RobotSplash onEnter={onEnter} />);
    const skip = screen.getByRole('button', { name: /skip to portfolio/i });
    fireEvent.click(skip);
    expect(onEnter).toHaveBeenCalledTimes(1);
  });
});
