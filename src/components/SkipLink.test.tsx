import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  beforeEach(() => {
    // Create a main element for testing
    const mainElement = document.createElement('main');
    mainElement.id = 'main-content';
    mainElement.tabIndex = -1;
    document.body.appendChild(mainElement);
  });

  afterEach(() => {
    // Clean up
    const mainElement = document.getElementById('main-content');
    if (mainElement) {
      document.body.removeChild(mainElement);
    }
  });

  it('renders skip link that is visually hidden by default', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass('absolute', 'left-[-9999px]');
  });

  it('uses default target ID and label', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('uses custom target ID when provided', () => {
    render(<SkipLink targetId="custom-main" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '#custom-main');
  });

  it('uses custom label when provided', () => {
    render(<SkipLink label="Skip navigation" />);
    const link = screen.getByRole('link', { name: /skip navigation/i });
    expect(link).toBeInTheDocument();
  });

  it('focuses and scrolls to target element on click', async () => {
    const user = userEvent.setup();
    const scrollIntoViewSpy = vi.fn();
    const mainElement = document.getElementById('main-content');
    if (mainElement) {
      mainElement.scrollIntoView = scrollIntoViewSpy;
    }

    render(<SkipLink />);
    const link = screen.getByRole('link', { name: /skip to main content/i });

    await user.click(link);

    expect(mainElement).toHaveFocus();
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  it('prevents default link behavior', async () => {
    const user = userEvent.setup();
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: /skip to main content/i });

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    link.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('handles missing target element gracefully', async () => {
    const user = userEvent.setup();
    const mainElement = document.getElementById('main-content');
    if (mainElement) {
      document.body.removeChild(mainElement);
    }

    render(<SkipLink />);
    const link = screen.getByRole('link', { name: /skip to main content/i });

    // Should not throw error
    await user.click(link);
  });
});
