'use client';

import type { JSX } from 'react';
import { useEffect, useRef } from 'react';
import { cogPath } from '../lib/cog';

interface CogPairProps {
  // Large cog
  lx: number;
  ly: number;
  lr: number;
  lt: number;
  la: number;
  ld: number;
  // Small cog
  sx: number;
  sy: number;
  sr: number;
  st: number;
  sa: number;
  sd: number;
  // Animation
  speed?: number;
  width: number;
  height: number;
  viewBox: string;
  // Style variant
  variant: 'hero' | 'nav' | 'footer' | 'brandmark';
}

export function CogPair({
  lx,
  ly,
  lr,
  lt,
  la,
  ld,
  sx,
  sy,
  sr,
  st,
  sa,
  sd,
  speed = 0.25,
  width,
  height,
  viewBox,
  variant,
}: CogPairProps): JSX.Element {
  const largRef = useRef<SVGGElement | null>(null);
  const smRef = useRef<SVGGElement | null>(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const ratio = sr / lr;
    let raf: number;
    const tick = () => {
      angleRef.current += speed;
      const largeAngle = -(angleRef.current * ratio);
      if (largRef.current) largRef.current.style.transform = `rotate(${largeAngle}deg)`;
      if (smRef.current) smRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [speed, sr, lr]);

  const lgD = cogPath(lx, ly, lr, lt, la, ld);
  const smD = cogPath(sx, sy, sr, st, sa, sd);

  const largeFill = 'var(--color-surface-dark)';
  const largeStroke = 'var(--color-orange)';
  const smallFill = 'var(--color-dark-alt)';
  const smallStroke = 'rgba(253, 252, 250, 0.4)';

  return (
    <svg width={width} height={height} viewBox={viewBox}>
      {/* large cog group */}
      <g ref={largRef} style={{ transformOrigin: `${lx}px ${ly}px` }}>
        <path
          d={lgD}
          fill={largeFill}
          stroke={largeStroke}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {/* inner ring */}
        <circle
          cx={lx}
          cy={ly}
          r={lr * 0.7}
          fill="none"
          stroke={largeStroke}
          strokeWidth={0.75}
          opacity={0.25}
        />
        {/* spokes */}
        {[0, 60, 120].map((rot) => (
          <line
            key={rot}
            x1={lx}
            y1={ly - lr * 0.58}
            x2={lx}
            y2={ly + lr * 0.58}
            stroke={largeStroke}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.22}
            transform={`rotate(${rot} ${lx} ${ly})`}
          />
        ))}
        {/* hub */}
        <circle
          cx={lx}
          cy={ly}
          r={lr * 0.19}
          fill="var(--color-ink)"
          stroke={largeStroke}
          strokeWidth={1.5}
        />
        <circle cx={lx} cy={ly} r={lr * 0.07} fill="var(--color-orange)" />
      </g>

      {/* small cog group */}
      <g ref={smRef} style={{ transformOrigin: `${sx}px ${sy}px` }}>
        <path
          d={smD}
          fill={smallFill}
          stroke={smallStroke}
          strokeWidth={1.2}
          strokeLinejoin="round"
          opacity={0.75}
        />
        <circle
          cx={sx}
          cy={sy}
          r={sr * 0.7}
          fill="none"
          stroke={smallStroke}
          strokeWidth={0.6}
          opacity={0.15}
        />
        {[0, 90].map((rot) => (
          <line
            key={rot}
            x1={sx}
            y1={sy - sr * 0.58}
            x2={sx}
            y2={sy + sr * 0.58}
            stroke={smallStroke}
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={0.18}
            transform={`rotate(${rot} ${sx} ${sy})`}
          />
        ))}
        <circle
          cx={sx}
          cy={sy}
          r={sr * 0.19}
          fill="var(--color-ink)"
          stroke={smallStroke}
          strokeWidth={1.2}
          opacity={0.5}
        />
        <circle cx={sx} cy={sy} r={sr * 0.07} fill={smallStroke} opacity={0.5} />
      </g>
    </svg>
  );
}
