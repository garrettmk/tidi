import { test as base } from 'vitest';
import { Dependency, Provider, Container, dependency, provider } from '..';

export type TestFixtures = {
  valueA: string;
  dependencyA: Dependency<string>;
  providerA: Provider<Dependency<string>>;

  valueB: string;
  dependencyB: Dependency<string>;
  providerB: Provider<Dependency<string>>;

  valueC: string;
  dependencyC: Dependency<string>;
  providerC: Provider<Dependency<string>>;
  providerCInvalid: Provider<Dependency<string>>;

  valueUnknown: string,
  dependencyUnknown: Dependency<string>;
  providerUnknown: Provider<Dependency<string>>;

  container: Container;
  childContainer: Container;
}

export const test = base.extend<TestFixtures>({
  valueA: 'testA',
  dependencyA: async () => dependency<string>({ name: 'DEPENDENCY_A' }),
  providerA: async ({ dependencyA, valueA }, use) => await use(provider({
    provides: dependencyA,
    use: () => valueA,
  })),

  valueB: 'testB',
  dependencyB: async () => dependency<string>({ name: 'DEPENDENCY_B' }),
  providerB: async ({ dependencyB, valueB }, use) => await use(provider({
    provides: dependencyB,
    use: () => valueB,
  })),

  valueC: 'testC',
  dependencyC: async ({ valueC }) => dependency<string>({ 
    name: 'DEPENDENCY_C',
    validate: value => value === valueC,
  }),

  providerC: async ({ dependencyC, valueC, dependencyA, dependencyB }, use) => await use(provider({
    provides: dependencyC,
    requires: [dependencyA, dependencyB],
    use: () => valueC,
  })),

  providerCInvalid: async ({ dependencyC }, use) => await use(provider({
    provides: dependencyC,
    use: () => 'invalid',
  })),

  valueUnknown: 'testUnknown',
  dependencyUnknown: async () => dependency<string>({ name: 'DEPENDENCY_UNKNOWN' }),
  providerUnknown: async ({ dependencyUnknown, valueUnknown }, use) => await use(provider({
    provides: dependencyUnknown,
    use: () => valueUnknown,
  })),

  container: async ({ providerA, providerB, providerC }, use) => {
     await use(new Container([providerA, providerB, providerC]));
  },

  childContainer: async ({ container, providerCInvalid }, use) => {
    await use(new Container(container, [
      providerCInvalid
    ]));
  }
});