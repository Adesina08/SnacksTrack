import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver
const ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.stubGlobal('ResizeObserver', ResizeObserver);
