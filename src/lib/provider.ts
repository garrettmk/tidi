import type { Dependency, DependencyType, DependencyTypes } from "./dependency";

/**
 * Provides a value for a `Dependency`. A `Provider` is just an object with a few properties:
 * - `provides`: The dependency that this provider provides.
 * - `requires`: The dependencies that this provider requires.
 * - `use`: The factory function for the provided value. The dependencies given in `requires` will be resolved and passed to the function as arguments.
 * 
 * @example
 * 
 * ```ts
 * import { Provider, provider } from 'tidi';
 * import { DatabaseURLDependency, DatabaseClientDependency } from './dependencies';
 * 
 * const DatabaseURLProvider: Provider<typeof DatabaseURLDependency> = {
 *  provides: DatabaseURLDependency,
 *  use: () => new URL(process.env.DATABASE_URL),
 * };
 * 
 * // You can also use the `provider` helper function
 * const DatabaseClientProvider = provider({
 *  provides: DatabaseClientDependency,
 *  requires: [DatabaseURLDependency],
 *  use: (databaseURL) => new DatabaseClient(databaseURL),
 * });
 * ```
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
