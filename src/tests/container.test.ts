import { Provider, Container, ContainerDependency, dependency, provider } from '@/lib';
import { describe, expect } from 'vitest';
import { test } from './setup';

describe('Container', () => {
  describe('constructor', () => {
    test('should create an empty Container', () => {
      expect(() => { new Container() }).not.toThrow();
    });

    test('should create a Container with the given parent', () => {
      const parent = new Container();
      const child = new Container(parent);

      // @ts-expect-error
      expect(child.parent).toBe(parent);
    });

    test('should createa a Container with the given providers', () => {
      const providers: Provider[] = [];
      const container = new Container(providers);

      // @ts-expect-error
      expect(container.providers.size).toBe(0);
    });

    test('should create a Container with the given parent and providers', () => {
      const parent = new Container();
      const providers: Provider[] = [];
      const container = new Container(parent, providers);

      // @ts-expect-error
      expect(container.parent).toBe(parent);
      // @ts-expect-error
      expect(container.providers.size).toBe(0);
    });
  });

  describe('resolve', () => {
    test('resolves a single, isolated dependency', async ({ container, dependencyA, valueA }) => {
      const value = await container.resolve(dependencyA);

      expect(value).toBe(valueA);
    });

    test('resolves a dependency with its own dependencies', async ({ container, providerA, valueA, providerB, valueB, dependencyC, valueC, providerC }) => {
      const value = await container.resolve(dependencyC);

      expect(providerA.use).toHaveBeenCalled();
      expect(providerB.use).toHaveBeenCalled();
      expect(providerC.use).toHaveBeenCalledWith(valueA, valueB);
      expect(value).toBe(valueC);
    });

    test('returns a cached value if the dependency has already been resolved', async ({ container, dependencyA, providerA, valueA }) => {
      await container.resolve(dependencyA);
      const value = await container.resolve(dependencyA);

      expect(providerA.use).toHaveBeenCalledTimes(1);
      expect(value).toBe(valueA);
    });

    test('resolves a dependency from the parent container', async ({ childContainer, valueA, dependencyA }) => {
      const value = await childContainer.resolve(dependencyA);

      expect(value).toBe(valueA);
    });

    test('validates the resolved value', async ({ container, dependencyC }) => {
      expect(() => container.resolve(dependencyC)).rejects.toThrow();
    });

    test('returns itself when resolving ContainerDependency', async ({ container }) => {
      const value = await container.resolve(ContainerDependency);

      expect(value).toBe(container);
    });

    test('resolves an array of dependencies', async ({ container, dependencyA, valueA, dependencyB, valueB, dependencyC, valueC }) => {
      const values = await container.resolve([dependencyA, dependencyB, dependencyC]);

      expect(values).toEqual([valueA, valueB, valueC]);
    })
  });


  describe('resolveAll', () => {
    test('resolves all dependencies', async ({ container, dependencyA, providerA, valueA, dependencyB, providerB, valueB, dependencyC, valueC, providerC }) => {
      await container.resolveAll();

      expect(providerA.use).toHaveBeenCalledTimes(1);
      expect(providerB.use).toHaveBeenCalledTimes(1);
      expect(providerC.use).toHaveBeenCalledWith(valueA, valueB);

      const values = container.get([dependencyA, dependencyB, dependencyC]);

      expect(values).toEqual([valueA, valueB, valueC]);
    });
  })


  describe('get', () => {
    test('returns the previously resolved value', async ({ container, dependencyA, valueA }) => {
      await container.resolve(dependencyA);
      const value = container.get(dependencyA);

      expect(value).toBe(valueA);
    });

    test('returns an array of previously resolved values', async ({ container, dependencyA, valueA, dependencyB, valueB, dependencyC, valueC }) => {
      await container.resolve([dependencyA, dependencyB, dependencyC]);
      const values = container.get([dependencyA, dependencyB, dependencyC]);

      expect(values).toEqual([valueA, valueB, valueC]);
    });

    test('throws an error if the value has not been resolved', async ({ container, dependencyA }) => {
      expect(() => container.get(dependencyA)).toThrow();
    });

    test('returns itself when getting ContainerDependency', async ({ container }) => {
      const value = container.get(ContainerDependency);

      expect(value).toBe(container);
    });

    test('get a values from the parent container', async ({ childContainer, dependencyA, valueA }) => {
      const value = childContainer.get(dependencyA);

      expect(value).toBe(valueA);
    });
  });


  describe('getProvider', () => {
    test('returns the provider for the given dependency', async ({ container, dependencyA, providerA }) => {
      const provider = container.getProvider(dependencyA);

      expect(provider).toBe(providerA);
    });

    test('throws an error if the provider does not exist', async ({ container, dependencyA }) => {
      expect(() => container.getProvider(dependencyA)).toThrow();
    });
  });


  describe('useProvider', () => {
    test('resolves the provider and returns the result', async ({ container, providerA, providerB, valueC, providerC }) => {
      const value = await container.useProvider(providerC);

      expect(value).toBe(valueC);
      expect(providerA.use).toHaveBeenCalled();
      expect(providerB.use).toHaveBeenCalled();
    });
  });

  describe('isResolved', () => {
    test('returns true if the dependency has been resolved', async ({ container, dependencyA }) => {
      await container.resolve(dependencyA);

      expect(container.isResolved(dependencyA)).toBe(true);
    });

    test('returns false if the dependency has not been resolved', async ({ container, dependencyA }) => {
      expect(container.isResolved(dependencyA)).toBe(false);
    });
  });

  describe('isAllResolved', () => {
    test('returns true if all dependencies have been resolved', async ({ container }) => {
      await container.resolveAll();

      expect(container.isAllResolved()).toBe(true);
    });

    test('returns false if not all dependencies have been resolved', async ({ container, dependencyA }) => {
      await container.resolve(dependencyA);

      expect(container.isAllResolved()).toBe(false);
    });
  });

  describe('validate', () => {
    test('does nothing if the dependency has no validator', async ({ container, dependencyA }) => {
      expect(() => container.validate('anything', dependencyA)).not.toThrow();
    });

    test('throws an error if the validator returns false', async ({ container, dependencyC }) => {
      expect(() => container.validate('anything', dependencyC)).toThrow();
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

      const container = new Container();

      expect(() => container.checkForCircularDependencies(providerA)).toThrow();
      expect(() => container.checkForCircularDependencies(providerB)).toThrow();
    });

    test('does not throw an error if no circular dependencies are found', async ({ container, providerA }) => {
      expect(() => container.checkForCircularDependencies(providerA)).not.toThrow();
    });
  });

  describe('getDependents', () => {
    test('returns an array of dependencies that depend on the given dependency', async ({ container, dependencyA, dependencyC }) => {
      const dependents = container.getDependents(dependencyA);

      expect(dependents).toEqual([dependencyC]);
    });

    test('returns an empty array if no dependencies depend on the given dependency', async ({ container, dependencyB }) => {
      const dependents = container.getDependents(dependencyB);

      expect(dependents).toEqual([]);
    });
  });

  describe('invalidate', () => {
    test('invalidates the given dependency', async ({ container, dependencyA }) => {
      await container.resolve(dependencyA);
      container.invalidate(dependencyA);

      expect(container.isResolved(dependencyA)).toBe(false);
    });


    test('invalidates all dependencies that depend on the given dependency', async ({ container, dependencyA, dependencyB }) => {
      await container.resolveAll();
      container.invalidate(dependencyA);

      expect(container.isResolved(dependencyB)).toBe(false);
    });
  });

  describe('getDependents', () => {
    test('should return an array of dependencies that depend on the given dependency', async ({ container, dependencyA, dependencyB, dependencyC }) => {
      const dependents = container.getDependents(dependencyC);

      expect(dependents).toEqual([dependencyA, dependencyB]);
    });
  });
});