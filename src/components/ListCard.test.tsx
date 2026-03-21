import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListCard } from './ListCard';

describe('ListCard', () => {
  it('renders title, tag, and date', () => {
    render(<ListCard title="Claude Code" tag="Projects" date="Today — 14:32" />);

    expect(screen.getByText('Claude Code')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Today — 14:32')).toBeInTheDocument();
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<ListCard title="Claude Code" onClick={onClick} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
