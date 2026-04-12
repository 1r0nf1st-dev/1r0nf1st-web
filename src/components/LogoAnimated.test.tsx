import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LogoAnimated, LOGO_ANIMATED_PATHS } from './LogoAnimated';

function renderInSizedBox(ui: ReactNode, w = 280, h = 280): void {
  render(
    <div
      style={{
        display: 'grid',
        width: w,
        height: h,
        placeItems: 'stretch',
      }}
    >
      {ui}
    </div>,
  );
}

describe('LogoAnimated', () => {
  it('renders four layers with correct src and blend stack classes', () => {
    renderInSizedBox(<LogoAnimated />);

    const host = screen.getByRole('img', { name: /1r0nf1st logo/i });
    expect(host).toHaveClass('logo-animated-host');

    const inner = host.querySelector('.logo-animated');
    expect(inner).not.toBeNull();
    expect(inner).toHaveStyle({ '--logo-animated-max': '280px' });

    const images = host.querySelectorAll('img');
    expect(images).toHaveLength(4);
    expect(images[0]).toHaveAttribute('src', LOGO_ANIMATED_PATHS.outerCog);
    expect(images[0]).toHaveClass('logo-animated__outer-cog');
    expect(images[1]).toHaveAttribute('src', LOGO_ANIMATED_PATHS.innerCog);
    expect(images[1]).toHaveClass('logo-animated__inner-cog');
    expect(images[2]).toHaveAttribute('src', LOGO_ANIMATED_PATHS.innerCircle);
    expect(images[3]).toHaveAttribute('src', LOGO_ANIMATED_PATHS.innerMark);
    images.forEach((img) => {
      expect(img).toHaveClass('logo-animated__layer');
      expect(img).toHaveAttribute('alt', '');
    });
  });

  it('adds brand-orange host class when variant is brand-orange', () => {
    renderInSizedBox(<LogoAnimated variant="brand-orange" />);

    const host = screen.getByRole('img', { name: /1r0nf1st logo/i });
    expect(host).toHaveClass('logo-animated-host--brand-orange');
  });

  it('applies custom size and host className', () => {
    renderInSizedBox(<LogoAnimated size={120} className="extra" />);

    const host = screen.getByRole('img', { name: /1r0nf1st logo/i });
    expect(host).toHaveClass('logo-animated-host');
    expect(host).toHaveClass('extra');

    const inner = host.querySelector('.logo-animated');
    expect(inner).toHaveStyle({ '--logo-animated-max': '120px' });
  });

  it('hides from a11y tree when aria-hidden', () => {
    renderInSizedBox(<LogoAnimated aria-hidden />);

    expect(screen.queryByRole('img', { name: /1r0nf1st logo/i })).toBeNull();
  });
});
