import type { Dependency, DependencyType, DependencyTypes } from "./dependency";

/**
 * Represents a provider for a `Dependency`.
 * 
 * @example
 * ```ts
 * const MyDependency = dependency({...});
 * const MyOtherDependency = dependency({...});
 * 
 * const MyDependencyProvider = provider({
 *  provides: MyDependency,
 *  use: () => new MyDependency(),
 * });
 * 
 * // MyDependency will be resolved and passed to the factory function.
 * const MyOtherDependencyProvider = provider({
 *  provides: MyOtherDependency,
 *  requires: [MyDependency],
 *  use: (myDependency) => new MyOtherDependency(myDependency),
 * });
 */
export interface Provider<T extends Dependency = Dependency, D extends [...Dependency[]] = [...Dependency[]]> {
  /**
   * The dependency that this provider provides.
   */
  readonly provides: T

  /**
   * The dependencies that this provider requires.
   */
  readonly requires?: [...D];

  /**
   * The factory function for the provided value. The dependencies given in
   * `requires` will be resolved and passed to the function as arguments.
   */
  readonly use: (...args: DependencyTypes<D>) => DependencyType<T> | Promise<DependencyType<T>>;
}

/**
 * Defines a `Provider`. This is mostly a convenience function to give a
 * consistent interface for creating dependencies and providers.
 * 
 * @param options 
 * @returns 
 */
export function provider<D extends Dependency, U extends [...Dependency[]]>(options: Provider<D, U>): Provider<D, U> {
  return Object.freeze(options);
}
