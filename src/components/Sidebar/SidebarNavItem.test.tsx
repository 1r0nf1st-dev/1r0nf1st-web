import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Home } from 'lucide-react';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { SidebarNavItem } from './SidebarNavItem';

describe('SidebarNavItem', () => {
  it('renders label and icon when expanded', () => {
    render(
      <SidebarProvider>
        <SidebarNavItem href="/notes" label="Dashboard" icon={Home} />
      </SidebarProvider>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders badge capped at 99+', () => {
    render(
      <SidebarProvider>
        <SidebarNavItem href="/notes/shared" label="Shared" icon={Home} badge={120} />
      </SidebarProvider>,
    );

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('hides badge when badge is zero', () => {
    render(
      <SidebarProvider>
        <SidebarNavItem href="/notes/shared" label="Shared" icon={Home} badge={0} />
      </SidebarProvider>,
    );

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
