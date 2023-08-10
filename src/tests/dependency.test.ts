import { describe, test, expect } from 'vitest';
import { dependency } from '@/lib';

describe('dependency', () => {
  test('should freeze the given object and return it', () => {
    const options = { name: 'test' };
    const dep = dependency(options);

    expect(dep).toBe(options);
    expect(Object.isFrozen(dep)).toBe(true);
  });
});