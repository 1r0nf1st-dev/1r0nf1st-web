import type { Page } from '@playwright/test';

export interface DarkChromeIssue {
  path: string;
  tag: string;
  className: string;
  backgroundColor: string;
}

/**
 * Heuristic: inside known dark UI roots, flag controls whose computed background is
 * nearly white — usually means light-mode Tailwind leaked (e.g. bg-white without .dark).
 */
export async function scanNearWhiteControlsInDarkRoots(
  page: Page,
  path: string,
  options: { minRgb?: number; maxChecks?: number } = {},
): Promise<DarkChromeIssue[]> {
  const minRgb = options.minRgb ?? 248;
  const maxChecks = options.maxChecks ?? 500;

  return page.evaluate(
    ({ minRgb: threshold, maxChecks: limit, routePath }) => {
      const roots = document.querySelectorAll('.app-shell, .login-shell, .note-modal');
      const issues: Array<{
        path: string;
        tag: string;
        className: string;
        backgroundColor: string;
      }> = [];
      let checked = 0;

      const parseRgb = (value: string): { r: number; g: number; b: number; a: number } | null => {
        const m = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
        if (!m) return null;
        const r = Number(m[1]);
        const g = Number(m[2]);
        const b = Number(m[3]);
        const a = m[4] !== undefined ? Number(m[4]) : 1;
        return { r, g, b, a };
      };

      roots.forEach((root) => {
        root.querySelectorAll('button, [role="button"], a[class*="btn"]').forEach((el) => {
          if (checked >= limit) return;
          checked += 1;
          const bg = getComputedStyle(el).backgroundColor;
          const rgb = parseRgb(bg);
          if (!rgb || rgb.a < 0.85) return;
          if (rgb.r >= threshold && rgb.g >= threshold && rgb.b >= threshold) {
            const htmlEl = el as HTMLElement;
            issues.push({
              path: routePath,
              tag: htmlEl.tagName,
              className: (htmlEl.className && String(htmlEl.className).slice(0, 160)) || '',
              backgroundColor: bg,
            });
          }
        });
      });

      return issues;
    },
    { minRgb, maxChecks, routePath: path },
  );
}
