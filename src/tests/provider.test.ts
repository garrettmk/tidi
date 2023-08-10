import { describe, test, expect } from 'vitest';
import { dependency, provider } from '@/lib';

describe('provider', () => {
  const Dependency = dependency({ name: 'test' });

  test('should freeze the given object and return it', () => {
    const options = { provides: Dependency, use: () => null };
    const dep = provider(options);

    expect(dep).toBe(options);
    expect(Object.isFrozen(dep)).toBe(true);
  });
});