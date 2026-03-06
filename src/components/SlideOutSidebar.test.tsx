import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlideOutSidebar } from './SlideOutSidebar';

describe('SlideOutSidebar', () => {
  it('renders children when open', () => {
    render(
      <SlideOutSidebar isOpen onClose={() => {}} title="Tools">
        <p>Sidebar content</p>
      </SlideOutSidebar>,
    );

    expect(screen.getByText('Sidebar content')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Tools' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('calls onClose when Close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <SlideOutSidebar isOpen onClose={onClose} title="Tools">
        <p>Content</p>
      </SlideOutSidebar>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(
      <SlideOutSidebar isOpen onClose={onClose} title="Tools">
        <p>Content</p>
      </SlideOutSidebar>,
    );

    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeInTheDocument();
    if (overlay) {
      await userEvent.click(overlay as HTMLElement);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });
});
