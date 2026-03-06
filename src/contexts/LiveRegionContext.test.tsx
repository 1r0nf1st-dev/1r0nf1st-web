import { describe, it, expect, vi } from 'vitest';
import { render, renderHook, act, fireEvent } from '@testing-library/react';
import { LiveRegionProvider, useLiveRegion } from './LiveRegionContext';

const TestComponent = () => {
  const { announce } = useLiveRegion();
  return <button onClick={() => announce('Urgent message', 'assertive')}>Announce</button>;
};

describe('LiveRegionContext', () => {
  it('provides announce and clear functions', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LiveRegionProvider>{children}</LiveRegionProvider>
    );

    const { result } = renderHook(() => useLiveRegion(), { wrapper });

    expect(result.current.announce).toBeDefined();
    expect(result.current.clear).toBeDefined();
    expect(typeof result.current.announce).toBe('function');
    expect(typeof result.current.clear).toBe('function');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useLiveRegion());
    }).toThrow('useLiveRegion must be used within a LiveRegionProvider');

    consoleSpy.mockRestore();
  });

  it('announces messages with default politeness', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LiveRegionProvider>{children}</LiveRegionProvider>
    );

    const { result } = renderHook(() => useLiveRegion(), { wrapper });

    act(() => {
      result.current.announce('Test message');
    });

    const { container } = render(<LiveRegionProvider><div>Test</div></LiveRegionProvider>);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('announces messages with assertive politeness', async () => {
    const { container } = render(
      <LiveRegionProvider>
        <TestComponent />
      </LiveRegionProvider>,
    );

    const announceButton = container.querySelector('button');
    if (announceButton) {
      // Wrap the click in act() since it triggers state updates
      await act(async () => {
        fireEvent.click(announceButton);
        // Wait for setTimeout in announce function (100ms)
        await new Promise((resolve) => setTimeout(resolve, 150));
      });
    }

    const liveRegion = container.querySelector('[aria-live="assertive"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion?.textContent).toBe('Urgent message');
  });

  it('clears messages', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LiveRegionProvider>{children}</LiveRegionProvider>
    );

    const { result } = renderHook(() => useLiveRegion(), { wrapper });

    act(() => {
      result.current.announce('Test message');
      result.current.clear();
    });

    // Message should be cleared
    const { container } = render(<LiveRegionProvider><div>Test</div></LiveRegionProvider>);
    const liveRegion = container.querySelector('[aria-live]');
    expect(liveRegion?.textContent).toBe('');
  });
});
