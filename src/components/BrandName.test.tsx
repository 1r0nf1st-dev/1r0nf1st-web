import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandName } from './BrandName';

describe('BrandName', () => {
  it('renders the brand with logo and is accessible', () => {
    render(<BrandName />);
    const span = screen.getByLabelText('1r0nf1st');
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent('1r');
    expect(span).toHaveTextContent('nf1st');
    const img = span.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/images/1rd0nf2st-lg-tr.png');
  });

  it('accepts optional className', () => {
    render(<BrandName className="font-bold" />);
    const span = screen.getByLabelText('1r0nf1st');
    expect(span).toHaveClass('font-bold');
  });
});
