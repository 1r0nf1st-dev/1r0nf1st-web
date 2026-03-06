/** Glassmorphic card classes - modern design with backdrop blur */
/** Base glassmorphic card - fallback handled via CSS @supports in globals.css */
/** Note: Includes p-6 padding by default. Components needing responsive padding should override with p-4 md:p-5 lg:p-6 */
export const cardClasses =
  'relative rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm md:backdrop-blur-md overflow-hidden p-6 shadow-lg transition-all duration-200 glass-card-fallback';
/** Lighter card for sidebars: flat, no overlay. Preserved for sidebar compatibility. */
export const cardSidebar =
  'rounded-xl border border-primary/25 dark:border-border bg-white dark:bg-surface overflow-hidden p-5 shadow-sm dark:shadow-none';
export const cardTitle = 'text-base font-semibold mb-2 text-foreground';
export const cardBody = 'text-muted text-sm leading-relaxed m-0 relative z-10';
