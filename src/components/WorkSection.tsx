import type { JSX } from 'react';

interface WorkItem {
  title: string;
  desc: string;
  tags: string[];
}

const workItems: WorkItem[] = [
  {
    title: 'Second Brain',
    desc: 'Supabase-powered knowledge system with semantic vector search',
    tags: ['Next.js', 'pgvector'],
  },
  {
    title: 'Mobile QA Agent',
    desc: 'Playwright-powered mobile UI testing pipeline on Kubernetes',
    tags: ['TypeScript', 'K8s'],
  },
  {
    title: 'Dev Dashboard',
    desc: 'Internal tooling with real-time Datadog log monitoring',
    tags: ['React', 'Datadog'],
  },
];

export const WorkSection = (): JSX.Element => {
  return (
  <section
    id="work"
    className="work border-b border-[color:var(--color-rule-dark)] bg-[color:var(--color-surface)] px-8 py-14"
  >
    <div className="mb-7 flex items-center gap-3">
      <div className="h-px flex-1 bg-[color:var(--color-rule-dark)]" />
      <div className="whitespace-nowrap font-mono text-[9px] font-medium uppercase tracking-[0.20em] text-[color:var(--color-text-inv-2)]">
        Selected Work
      </div>
      <div className="h-px flex-1 bg-[color:var(--color-rule-dark)]" />
    </div>
    <h2 className="mb-7 font-display text-[1.7rem] font-black italic uppercase tracking-[-0.01em] text-[color:var(--color-text-inv)]">
      Things We&apos;ve Engineered
    </h2>
    <div>
      {workItems.map((item) => (
        <div
          key={item.title}
          className="work-row relative grid cursor-pointer grid-cols-[3fr_1fr_auto] items-center gap-5 border-b border-[color:var(--color-rule-dark)] py-[18px]"
        >
          <div>
            <div className="mb-0.5 font-display text-[14px] font-bold uppercase tracking-[0.04em] text-[color:var(--color-text-inv)]">
              {item.title}
            </div>
            <div className="font-display text-[12px] font-normal text-[color:var(--color-text-inv-2)]">
              {item.desc}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="wtag border border-[color:var(--color-steel-border)] bg-[color:var(--color-steel-bg)] px-2 py-[3px] font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-steel)]"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="work-arrow text-[16px] text-[color:var(--color-text-inv-2)] transition-colors transition-transform">
            →
          </div>
        </div>
      ))}
    </div>
  </section>
  );
};
