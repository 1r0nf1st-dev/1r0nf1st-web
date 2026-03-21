import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageHero } from './PageHero';

describe('PageHero', () => {
  it('renders watermark and title', () => {
    render(<PageHero flagLabel="Library" title="All Notes" watermark="All Notes" />);

    expect(screen.getByRole('heading', { name: 'All Notes' })).toBeInTheDocument();
  });

  it('renders public subtitle and CTAs', () => {
    render(
      <PageHero
        variant="public"
        flagLabel="About"
        title={
          <>
            Precision
            <br />
            <em>Engineered.</em>
          </>
        }
        watermark="1r0nf1st"
        subtitle="We build tools and web experiences..."
        primaryBtn={{ label: 'View Projects', href: '/projects' }}
        secondaryBtn={{ label: 'Get In Touch', href: '/contact' }}
      />,
    );

    expect(screen.getByText(/We build tools and web experiences/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get In Touch' })).toBeInTheDocument();
  });

  it('renders tabs and fires onTabChange', async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PageHero
        flagLabel="Library"
        title="All Notes"
        watermark="All Notes"
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'pinned', label: 'Pinned' },
        ]}
        activeTabId="all"
        onTabChange={onTabChange}
      />,
    );

    await user.click(screen.getByRole('tab', { name: 'Pinned' }));
    expect(onTabChange).toHaveBeenCalledWith('pinned');
  });
});
