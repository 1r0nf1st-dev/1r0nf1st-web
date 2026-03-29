import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { SidebarNav } from './SidebarNav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/notes',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}));

vi.mock('../../contexts/NotesActionsContext', () => ({
  useNotesActions: () => ({
    createNote: vi.fn(),
    openSearch: vi.fn(),
    openWebClipper: vi.fn(),
    toggleWidget: vi.fn(),
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'admin@1r0nf1st.com', username: 'admin' },
  }),
}));

vi.mock('./SavedSearchesSection', () => ({ SavedSearchesSection: () => null }));
vi.mock('./SidebarWidgets', () => ({ SidebarWidgets: () => null }));

describe('SidebarNav', () => {
  it('renders the interior brief nav items in order', () => {
    const { container } = render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>,
    );

    const labels = screen.getAllByText(
      /New Note|From Template|Templates|All Notes|Notebooks|Tags|Archives|Shared|Second Brain|Open Brain|Explore|Search|Web Clipper|Settings|Widgets/,
    );
    const rendered = labels.map((n) => n.textContent);

    // Minimal ordering check for the first set of items (brief Section 4d)
    expect(rendered.indexOf('New Note')).toBeLessThan(rendered.indexOf('From Template'));
    expect(rendered.indexOf('From Template')).toBeLessThan(rendered.indexOf('Templates'));
    expect(rendered.indexOf('Templates')).toBeLessThan(rendered.indexOf('All Notes'));

    // Saved searches sits with notes (after Shared, before Intelligence)
    const text = container.textContent ?? '';
    expect(text.indexOf('Shared')).toBeLessThan(text.indexOf('Saved searches'));
    expect(text.indexOf('Saved searches')).toBeLessThan(text.indexOf('Second Brain'));

    expect(screen.queryByText('Quick templates')).toBeNull();
  });
});
