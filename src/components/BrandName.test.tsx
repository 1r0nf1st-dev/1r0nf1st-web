import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BRAND_NAME } from '../config';
import { BrandName } from './BrandName';

describe('BrandName', () => {
  it('renders the brand with logo and is accessible', () => {
    render(<BrandName />);
    const span = screen.getByLabelText(BRAND_NAME);
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent('1r');
    expect(span).toHaveTextContent('nf1st');
    const mark = screen.getByTestId('brand-mark');
    expect(mark).toBeInTheDocument();
  });

  it('accepts optional className', () => {
    render(<BrandName className="font-bold" />);
    const span = screen.getByLabelText(BRAND_NAME);
    expect(span).toHaveClass('font-bold');
  });

  it('supports orange mark tint', () => {
    render(<BrandName markTint="orange" />);
    const span = screen.getByLabelText(BRAND_NAME);
    expect(span).toBeInTheDocument();
    const mark = screen.getByTestId('brand-mark');
    expect(mark).toBeInTheDocument();
    // Use inline style assertion (CSS variables are not resolved in JSDOM computed styles)
    expect((mark as HTMLElement).style.backgroundColor).toBe('var(--color-orange)');
  });
});
