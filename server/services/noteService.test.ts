import { describe, it, expect } from 'vitest';
import { parseSearchOperators } from './noteService.js';

describe('parseSearchOperators', () => {
  it('returns empty text for empty input', () => {
    expect(parseSearchOperators('')).toEqual({ text: '' });
    expect(parseSearchOperators('   ')).toEqual({ text: '' });
    expect(parseSearchOperators(null as unknown as string)).toEqual({ text: '' });
  });

  it('returns plain text when no operators', () => {
    expect(parseSearchOperators('meeting notes')).toEqual({ text: 'meeting notes' });
  });

  it('parses tag: operator (single word)', () => {
    expect(parseSearchOperators('tag:work')).toEqual({
      tagName: 'work',
      text: '',
    });
    expect(parseSearchOperators('tag:work meeting')).toEqual({
      tagName: 'work',
      text: 'meeting',
    });
  });

  it('parses tag: operator (quoted multi-word)', () => {
    expect(parseSearchOperators('tag:"work stuff"')).toEqual({
      tagName: 'work stuff',
      text: '',
    });
    expect(parseSearchOperators('tag:"work stuff" ideas')).toEqual({
      tagName: 'work stuff',
      text: 'ideas',
    });
  });

  it('parses notebook: operator', () => {
    expect(parseSearchOperators('notebook:projects')).toEqual({
      notebookName: 'projects',
      text: '',
    });
  });

  it('parses is:archived and is:active', () => {
    expect(parseSearchOperators('is:archived')).toEqual({
      archived: true,
      text: '',
    });
    expect(parseSearchOperators('is:active')).toEqual({
      archived: false,
      text: '',
    });
  });

  it('parses combined operators', () => {
    expect(parseSearchOperators('tag:work notebook:projects meeting')).toEqual({
      tagName: 'work',
      notebookName: 'projects',
      text: 'meeting',
    });
  });

  it('uses last occurrence when operator repeated', () => {
    expect(parseSearchOperators('tag:work tag:personal')).toEqual({
      tagName: 'personal',
      text: '',
    });
  });
});
