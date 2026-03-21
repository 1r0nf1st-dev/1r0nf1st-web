'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { getJson } from '../../apiClient';

interface DigestData {
  projects: Record<string, unknown>[];
  tasksDue: Record<string, unknown>[];
  ideasRecent: Record<string, unknown>[];
}

interface ReviewData {
  projectsUpdated: Record<string, unknown>[];
  tasksCompleted: Record<string, unknown>[];
  ideasNew: Record<string, unknown>[];
  peopleFollowUp: Record<string, unknown>[];
}

export const DigestPanel = (): JSX.Element => {
  const [digestData, setDigestData] = useState<DigestData | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [generatedDigest, setGeneratedDigest] = useState<string | null>(null);
  const [generatedReview, setGeneratedReview] = useState<string | null>(null);
  const [loading, setLoading] = useState<'digest' | 'review' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'raw' | 'daily' | 'weekly'>('raw');

  const loadDigestData = (): void => {
    setError(null);
    getJson<DigestData>('/api/second-brain/digest')
      .then(setDigestData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load digest'));
  };

  const loadReviewData = (): void => {
    setError(null);
    getJson<ReviewData>('/api/second-brain/review')
      .then(setReviewData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load review'));
  };

  const generateDigest = async (): Promise<void> => {
    setLoading('digest');
    setError(null);
    try {
      const res = await getJson<{ digest: string }>('/api/second-brain/digest/generate');
      setGeneratedDigest(res.digest);
      setView('daily');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setLoading(null);
    }
  };

  const generateReview = async (): Promise<void> => {
    setLoading('review');
    setError(null);
    try {
      const res = await getJson<{ review: string }>('/api/second-brain/review/generate');
      setGeneratedReview(res.review);
      setView('weekly');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    if (view === 'raw') {
      loadDigestData();
      loadReviewData();
    }
  }, [view]);

  return (
    <div className="content-panel max-w-2xl">
      <h2 className="panel-title">Digest &amp; Weekly Review</h2>
      <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]">
        View raw data or generate AI digests.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setView('raw');
            loadDigestData();
            loadReviewData();
          }}
          className={view === 'raw' ? 'act-btn primary' : 'act-btn'}
        >
          Raw data
        </button>
        <button
          type="button"
          onClick={generateDigest}
          disabled={loading !== null}
          className="act-btn primary disabled:opacity-70"
        >
          {loading === 'digest' ? 'Generating…' : 'Morning digest'}
        </button>
        <button
          type="button"
          onClick={generateReview}
          disabled={loading !== null}
          className="act-btn primary disabled:opacity-70"
        >
          {loading === 'review' ? 'Generating…' : 'Weekly review'}
        </button>
      </div>

      {error && (
        <p className="font-display text-[12px] text-[color:var(--color-orange)]" role="alert">
          {error}
        </p>
      )}

      {view === 'daily' && generatedDigest && (
        <div className="content-panel whitespace-pre-wrap font-display text-[12px] text-[color:var(--color-text-inv)]">
          {generatedDigest}
        </div>
      )}

      {view === 'weekly' && generatedReview && (
        <div className="content-panel whitespace-pre-wrap font-display text-[12px] text-[color:var(--color-text-inv)]">
          {generatedReview}
        </div>
      )}

      {view === 'raw' && (
        <div className="space-y-6">
          {digestData && (
            <div>
              <h3 className="mb-2 font-display text-[14px] font-bold uppercase tracking-[0.04em] text-[color:var(--color-text-inv)]">
                Today&apos;s focus (digest)
              </h3>
              <ul className="space-y-1 font-display text-[12px] text-[color:var(--color-text-inv-2)]">
                <li>Projects: {digestData.projects.length}</li>
                <li>Tasks due: {digestData.tasksDue.length}</li>
                <li>Recent ideas: {digestData.ideasRecent.length}</li>
              </ul>
            </div>
          )}
          {reviewData && (
            <div>
              <h3 className="mb-2 font-display text-[14px] font-bold uppercase tracking-[0.04em] text-[color:var(--color-text-inv)]">
                This week (review)
              </h3>
              <ul className="space-y-1 font-display text-[12px] text-[color:var(--color-text-inv-2)]">
                <li>Projects updated: {reviewData.projectsUpdated.length}</li>
                <li>Tasks completed: {reviewData.tasksCompleted.length}</li>
                <li>New ideas: {reviewData.ideasNew.length}</li>
                <li>People to follow up: {reviewData.peopleFollowUp.length}</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
