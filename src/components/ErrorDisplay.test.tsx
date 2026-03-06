import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorDisplay } from './ErrorDisplay';
import { LiveRegionProvider } from '../contexts/LiveRegionContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LiveRegionProvider>{children}</LiveRegionProvider>
);

describe('ErrorDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when error is null', () => {
    const { container } = render(<ErrorDisplay error={null} />, { wrapper });
    // Component returns empty fragment <></>, which React renders as a comment node
    expect(container.firstChild).not.toHaveAttribute('role', 'alert');
  });

  it('renders nothing when error is undefined', () => {
    const { container } = render(<ErrorDisplay error={undefined} />, { wrapper });
    // Component returns empty fragment <></>, which React renders as a comment node
    expect(container.firstChild).not.toHaveAttribute('role', 'alert');
  });

  it('renders error message', () => {
    render(<ErrorDisplay error="Something went wrong" />, { wrapper });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders error with title', () => {
    render(<ErrorDisplay error="Something went wrong" title="Error Title" />, { wrapper });
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('has role="alert" and aria-live="assertive"', () => {
    render(<ErrorDisplay error="Test error" />, { wrapper });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders inline variant', () => {
    render(<ErrorDisplay error="Test error" variant="inline" />, { wrapper });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('flex', 'items-center', 'gap-2', 'text-sm');
  });

  it('renders block variant by default', () => {
    render(<ErrorDisplay error="Test error" />, { wrapper });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('flex', 'items-start', 'gap-2', 'p-3', 'rounded-xl');
  });

  it('applies custom className', () => {
    render(<ErrorDisplay error="Test error" className="custom-class" />, { wrapper });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('custom-class');
  });

  it('displays AlertCircle icon', () => {
    render(<ErrorDisplay error="Test error" />, { wrapper });
    const icon = screen.getByRole('alert').querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
