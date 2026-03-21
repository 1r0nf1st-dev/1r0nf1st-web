import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { Hero } from './Hero';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

describe('Hero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderHero = () => {
    return render(
      <ThemeProvider>
        <Hero />
      </ThemeProvider>,
    );
  };

  it('should render the hero headline', () => {
    renderHero();
    expect(screen.getByRole('heading', { name: /Built with/i })).toBeInTheDocument();
    expect(screen.getAllByLabelText('1r0nf1st').length).toBeGreaterThan(0);
  });

  it('should render primary CTAs', () => {
    renderHero();
    expect(screen.getByRole('link', { name: 'View Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Our Work ↓' })).toBeInTheDocument();
  });
});
