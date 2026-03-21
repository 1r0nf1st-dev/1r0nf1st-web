export function cogPath(
  cx: number,
  cy: number,
  pr: number,
  teeth: number,
  addendum: number,
  dedendum: number,
): string {
  const toothAngle = (Math.PI * 2) / teeth;
  const outerR = pr + addendum;
  const innerR = pr - dedendum;
  const rootR = innerR - dedendum * 0.3;
  const tw = 0.38;

  let d = '';

  for (let i = 0; i < teeth; i += 1) {
    const baseAngle = (i / teeth) * Math.PI * 2 - Math.PI / 2;
    const a1 = baseAngle + toothAngle * (0.5 - tw);
    const a2 = baseAngle + toothAngle * (0.5 - tw * 0.5);
    const a4 = baseAngle + toothAngle * (0.5 + tw * 0.5);
    const a5 = baseAngle + toothAngle * (0.5 + tw);
    const a6 = baseAngle + toothAngle;
    const a0 = baseAngle;

    const p = (r: number, a: number): [number, number] => [
      cx + r * Math.cos(a),
      cy + r * Math.sin(a),
    ];

    const [x0, y0] = p(rootR, a0);
    const [x1, y1] = p(innerR, a1);
    const [x2, y2] = p(outerR, a2);
    const [x4, y4] = p(outerR, a4);
    const [x5, y5] = p(innerR, a5);
    const [x6, y6] = p(rootR, a6);

    const f = (n: number) => n.toFixed(2);

    if (i === 0) d += `M${f(x0)},${f(y0)}`;
    d += ` L${f(x1)},${f(y1)}`;
    d += ` L${f(x2)},${f(y2)}`;
    d += ` A${f(outerR)},${f(outerR)} 0 0,1 ${f(x4)},${f(y4)}`;
    d += ` L${f(x5)},${f(y5)}`;
    d += ` L${f(x6)},${f(y6)}`;
    d += ` A${f(rootR)},${f(rootR)} 0 0,1 ${f(x6)},${f(y6)}`;
  }

  d += ' Z';
  return d;
}
