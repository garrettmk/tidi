import { Provider, Scope, ScopeDependency, dependency, provider } from '@/lib';
import { describe, expect } from 'vitest';
import { test } from './setup';

describe('Scope', () => {
  describe('constructor', () => {
    test('should create an empty Scope', () => {
      expect(() => { new Scope() }).not.toThrow();
    });

    test('should create a Scope with the given parent', () => {
      const parent = new Scope();
      const child = new Scope(parent);

      // @ts-expect-error
      expect(child.parent).toBe(parent);
    });

    test('should createa a Scope with the given providers', () => {
      const providers: Provider[] = [];
      const scope = new Scope(providers);

      // @ts-expect-error
      expect(scope.providers.size).toBe(0);
    });

    test('should create a Scope with the given parent and providers', () => {
      const parent = new Scope();
      const providers: Provider[] = [];
      const scope = new Scope(parent, providers);

      // @ts-expect-error
      expect(scope.parent).toBe(parent);
      // @ts-expect-error
      expect(scope.providers.size).toBe(0);
    });
  });

  describe('resolve', () => {
    test('resolves a single, isolated dependency', async ({ scope, dependencyA, valueA }) => {
      const value = await scope.resolve(dependencyA);

      expect(value).toBe(valueA);
    });

    test('resolves a dependency with its own dependencies', async ({ scope, providerA, valueA, providerB, valueB, dependencyC, valueC, providerC }) => {
      const value = await scope.resolve(dependencyC);

      expect(providerA.use).toHaveBeenCalled();
      expect(providerB.use).toHaveBeenCalled();
      expect(providerC.use).toHaveBeenCalledWith(valueA, valueB);
      expect(value).toBe(valueC);
    });

    test('returns a cached value if the dependency has already been resolved', async ({ scope, dependencyA, providerA, valueA }) => {
      await scope.resolve(dependencyA);
      const value = await scope.resolve(dependencyA);

      expect(providerA.use).toHaveBeenCalledTimes(1);
      expect(value).toBe(valueA);
    });

    test('resolves a dependency from the parent scope', async ({ childScope, valueA, dependencyA }) => {
      const value = await childScope.resolve(dependencyA);

      expect(value).toBe(valueA);
    });

    test('validates the resolved value', async ({ scope, dependencyC }) => {
      expect(() => scope.resolve(dependencyC)).rejects.toThrow();
    });

    test('returns itself when resolving ScopeDependency', async ({ scope }) => {
      const value = await scope.resolve(ScopeDependency);

      expect(value).toBe(scope);
    });

    test('resolves an array of dependencies', async ({ scope, dependencyA, valueA, dependencyB, valueB, dependencyC, valueC }) => {
      const values = await scope.resolve([dependencyA, dependencyB, dependencyC]);

      expect(values).toEqual([valueA, valueB, valueC]);
    })
  });


  describe('resolveAll', () => {
    test('resolves all dependencies', async ({ scope, dependencyA, providerA, valueA, dependencyB, providerB, valueB, dependencyC, valueC, providerC }) => {
      await scope.resolveAll();

      expect(providerA.use).toHaveBeenCalledTimes(1);
      expect(providerB.use).toHaveBeenCalledTimes(1);
      expect(providerC.use).toHaveBeenCalledWith(valueA, valueB);

      const values = scope.get([dependencyA, dependencyB, dependencyC]);

      expect(values).toEqual([valueA, valueB, valueC]);
    });
  })


  describe('get', () => {
    test('returns the previously resolved value', async ({ scope, dependencyA, valueA }) => {
      await scope.resolve(dependencyA);
      const value = scope.get(dependencyA);

      expect(value).toBe(valueA);
    });

    test('returns an array of previously resolved values', async ({ scope, dependencyA, valueA, dependencyB, valueB, dependencyC, valueC }) => {
      await scope.resolve([dependencyA, dependencyB, dependencyC]);
      const values = scope.get([dependencyA, dependencyB, dependencyC]);

      expect(values).toEqual([valueA, valueB, valueC]);
    });

    test('throws an error if the value has not been resolved', async ({ scope, dependencyA }) => {
      expect(() => scope.get(dependencyA)).toThrow();
    });

    test('returns itself when getting ScopeDependency', async ({ scope }) => {
      const value = scope.get(ScopeDependency);

      expect(value).toBe(scope);
    });

    test('get a values from the parent scope', async ({ childScope, dependencyA, valueA }) => {
      const value = childScope.get(dependencyA);

      expect(value).toBe(valueA);
    });
  });


  describe('getProvider', () => {
    test('returns the provider for the given dependency', async ({ scope, dependencyA, providerA }) => {
      const provider = scope.getProvider(dependencyA);

      expect(provider).toBe(providerA);
    });

    test('throws an error if the provider does not exist', async ({ scope, dependencyA }) => {
      expect(() => scope.getProvider(dependencyA)).toThrow();
    });
  });


  describe('useProvider', () => {
    test('resolves the provider and returns the result', async ({ scope, providerA, providerB, valueC, providerC }) => {
      const value = await scope.useProvider(providerC);

      expect(value).toBe(valueC);
      expect(providerA.use).toHaveBeenCalled();
      expect(providerB.use).toHaveBeenCalled();
    });
  });

  describe('isResolved', () => {
    test('returns true if the dependency has been resolved', async ({ scope, dependencyA }) => {
      await scope.resolve(dependencyA);

      expect(scope.isResolved(dependencyA)).toBe(true);
    });

    test('returns false if the dependency has not been resolved', async ({ scope, dependencyA }) => {
      expect(scope.isResolved(dependencyA)).toBe(false);
    });
  });

  describe('isAllResolved', () => {
    test('returns true if all dependencies have been resolved', async ({ scope }) => {
      await scope.resolveAll();

      expect(scope.isAllResolved()).toBe(true);
    });

    test('returns false if not all dependencies have been resolved', async ({ scope, dependencyA }) => {
      await scope.resolve(dependencyA);

      expect(scope.isAllResolved()).toBe(false);
    });
  });

  describe('validate', () => {
    test('does nothing if the dependency has no validator', async ({ scope, dependencyA }) => {
      expect(() => scope.validate('anything', dependencyA)).not.toThrow();
    });

    test('throws an error if the validator returns false', async ({ scope, dependencyC }) => {
      expect(() => scope.validate('anything', dependencyC)).toThrow();
    });
  });

  describe('checkForCircularDependencies', () => {
    test('throws an error if a circular dependency is found', async () => {
      const DependencyA = dependency<string>({ name: 'A' });
      const DependencyB = dependency<string>({ name: 'B' });

      const providerA = provider({
        provides: DependencyA,
        requires: [DependencyB],
        use: (b: string) => b
      });

      const providerB = provider({
        provides: DependencyB,
        requires: [DependencyA],
        use: (a: string) => a
      });

      const scope = new Scope();

      expect(() => scope.checkForCircularDependencies(providerA)).toThrow();
      expect(() => scope.checkForCircularDependencies(providerB)).toThrow();
    });

    test('does not throw an error if no circular dependencies are found', async ({ scope, providerA }) => {
      expect(() => scope.checkForCircularDependencies(providerA)).not.toThrow();
    });
  });

  describe('getDependents', () => {
    test('returns an array of dependencies that depend on the given dependency', async ({ scope, dependencyA, dependencyB, dependencyC }) => {
      const dependents = scope.getDependents(dependencyA);

      expect(dependents).toEqual([dependencyC]);
    });

    test('returns an empty array if no dependencies depend on the given dependency', async ({ scope, dependencyB }) => {
      const dependents = scope.getDependents(dependencyB);

      expect(dependents).toEqual([]);
    });
  });

  describe('invalidate', () => {
    test('invalidates the given dependency', async ({ scope, dependencyA }) => {
      await scope.resolve(dependencyA);
      scope.invalidate(dependencyA);

      expect(scope.isResolved(dependencyA)).toBe(false);
    });


    test('invalidates all dependencies that depend on the given dependency', async ({ scope, dependencyA, dependencyB }) => {
      await scope.resolveAll();
      scope.invalidate(dependencyA);

      expect(scope.isResolved(dependencyB)).toBe(false);
    });
  });

  describe('getDependents', () => {
    test('should return an array of dependencies that depend on the given dependency', async ({ scope, dependencyA, dependencyB, dependencyC }) => {
      const dependents = scope.getDependents(dependencyC);

      expect(dependents).toEqual([dependencyA, dependencyB]);
    });
  });
});