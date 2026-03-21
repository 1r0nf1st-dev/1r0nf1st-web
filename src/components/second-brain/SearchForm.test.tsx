import { describe, it, expect, vi } from 'vitest';
import { render, within } from '@testing-library/react';
import { SearchForm } from './SearchForm';

vi.mock('../../apiClient', () => ({
  getJson: vi.fn(),
}));

describe('SearchForm', () => {
  it('renders submit control inside input-row so mobile CSS keeps it inline with the field', () => {
    const { container } = render(<SearchForm />);

    const row = container.querySelector('.input-row');
    expect(row).toBeTruthy();

    const submit = within(row as HTMLElement).getByRole('button', { name: 'Search' });
    expect(row).toContainElement(submit);
    expect(submit).toHaveClass('input-row-btn');
  });
});
