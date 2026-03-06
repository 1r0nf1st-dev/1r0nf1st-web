/** Shared Tailwind class strings for buttons */
export const btnBase =
  'inline-flex items-center justify-center gap-1.5 py-2.5 px-5  text-sm font-medium transition-all duration-200 border cursor-pointer focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 min-h-[44px]';
/** Compact variant for icon/small buttons - use with btnBase and btnPrimary or btnGhost */
export const btnCompact = 'py-1.5 px-3 text-sm min-h-[44px] min-w-[44px]';
/** Icon-only button - square, compact - use with btnBase and btnGhost */
export const btnIcon = 'p-2 min-h-[44px] min-w-[44px] ';
/** Toolbar toggle button base - use with btnToolbarActive or btnToolbarInactive */
export const btnToolbar =
  'inline-flex items-center justify-center px-3 py-1 min-h-[28px]  text-sm font-medium border-2 border-primary/35 dark:border-border transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background disabled:opacity-50';
export const btnToolbarActive =
  'bg-primary text-white border-primary shadow-sm';
export const btnToolbarInactive =
  'bg-white dark:bg-surface text-foreground hover:bg-gray-100 dark:hover:bg-surface-soft hover:border-primary/50 dark:hover:border-border-strong';
/** Smaller toolbar button for table controls */
export const btnToolbarSm =
  'inline-flex items-center justify-center px-2 py-1 min-h-[24px]  text-xs font-medium border-2 border-primary/35 dark:border-border transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50';
/** Glassmorphic primary button */
export const btnPrimary =
  'bg-blue-600/90 backdrop-blur-sm text-white shadow-lg hover:bg-blue-600 hover:shadow-xl border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
/** Glassmorphic ghost button */
export const btnGhost =
  'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-100 hover:bg-white/90 dark:hover:bg-slate-800/90 hover:border-slate-300/60 dark:hover:border-slate-600/60 hover:shadow-md shadow-sm';
export const btnDanger =
  'bg-red-500/90 dark:bg-red-600/80 border-2 border-red-600/50 dark:border-red-500/50 text-white hover:bg-red-600 dark:hover:bg-red-700 hover:border-red-700 dark:hover:border-red-600 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed';
