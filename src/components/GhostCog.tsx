'use client';

import type { JSX } from 'react';
import { useEffect, useRef } from 'react';
import { cogPath } from '../lib/cog';

export function GhostCog({
  reverse = false,
  light = false,
}: {
  reverse?: boolean;
  /** Use light fill/stroke for dark backgrounds (pillar cards) */
  light?: boolean;
}): JSX.Element {
  const ref = useRef<SVGGElement | null>(null);
  const a = useRef(0);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      a.current += reverse ? -0.15 : 0.15;
      if (ref.current) ref.current.style.transform = `rotate(${a.current}deg)`;
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [reverse]);

  const d = cogPath(50, 50, 36, 10, 8, 6);
  const fillStroke = light ? '#F4F2EE' : 'var(--color-text-1)';

  return (
    <svg width={80} height={80} viewBox="0 0 80 80" style={{ opacity: 0.06 }}>
      <g ref={ref} style={{ transformOrigin: '50px 50px' }}>
        <path
          d={d}
          fill={fillStroke}
          stroke={fillStroke}
          strokeWidth={1}
          strokeLinejoin="round"
        />
        <circle cx={50} cy={50} r={25} fill="none" stroke={fillStroke} strokeWidth={1} />
        <circle cx={50} cy={50} r={8} fill="none" stroke={fillStroke} strokeWidth={1} />
      </g>
    </svg>
  );
}
