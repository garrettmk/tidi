import { describe, test, expect } from 'vitest';
import { helloWorld } from '@/lib';

describe('tidi', () => {
  test('should work', () => {
    expect(helloWorld).toBe('Hello, world!');
  });
})