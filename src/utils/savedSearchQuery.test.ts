import { describe, it, expect } from 'vitest';
import { buildSearchQuery, parseArchivedFromQuery } from './savedSearchQuery';

describe('buildSearchQuery', () => {
  const notebooks = [
    { id: 'nb1', name: 'Work' },
    { id: 'nb2', name: 'Personal Projects' },
  ];
  const tags = [
    { id: 't1', name: 'urgent' },
    { id: 't2', name: 'follow up' },
  ];

  it('builds query with search text only', () => {
    expect(
      buildSearchQuery({
        searchText: 'meeting notes',
        notebooks: [],
        tags: [],
      }),
    ).toBe('is:active meeting notes');
  });

  it('builds query with notebook and tag', () => {
    expect(
      buildSearchQuery({
        searchText: '',
        notebookId: 'nb1',
        tagId: 't1',
        notebooks,
        tags,
      }),
    ).toBe('is:active notebook:Work tag:urgent');
  });

  it('quotes notebook and tag names with spaces', () => {
    expect(
      buildSearchQuery({
        searchText: '',
        notebookId: 'nb2',
        tagId: 't2',
        notebooks,
        tags,
      }),
    ).toBe('is:active notebook:"Personal Projects" tag:"follow up"');
  });

  it('includes is:archived when showArchived', () => {
    expect(
      buildSearchQuery({
        searchText: 'old',
        showArchived: true,
        notebooks: [],
        tags: [],
      }),
    ).toBe('is:archived old');
  });

  it('returns empty string when no filters', () => {
    expect(
      buildSearchQuery({
        searchText: '',
        notebooks: [],
        tags: [],
      }),
    ).toBe('');
  });
});

describe('parseArchivedFromQuery', () => {
  it('returns true for is:archived', () => {
    expect(parseArchivedFromQuery('foo is:archived bar')).toBe(true);
  });

  it('returns false for is:active', () => {
    expect(parseArchivedFromQuery('is:active tag:work')).toBe(false);
  });

  it('returns undefined when neither present', () => {
    expect(parseArchivedFromQuery('tag:work notebook:main')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(parseArchivedFromQuery('')).toBeUndefined();
  });
});
