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

  it('uses brand-orange logo variant by default', () => {
    render(<BrandName />);
    const host = screen.getByTestId('brand-mark').querySelector('.logo-animated-host');
    expect(host).toBeInTheDocument();
    expect(host).toHaveClass('logo-animated-host--brand-orange');
  });

  it('uses neutral logo variant when markTint is auto', () => {
    render(<BrandName markTint="auto" />);
    const host = screen.getByTestId('brand-mark').querySelector('.logo-animated-host');
    expect(host).toBeInTheDocument();
    expect(host).not.toHaveClass('logo-animated-host--brand-orange');
  });
});
