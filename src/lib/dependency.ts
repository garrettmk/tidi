
/**
 * Represents a value that can be requested from a `Scope`. A `Dependency` is just an object with a few properties: 
 * - `name`: A human-readable identifier for the dependency.
 * - `validate`: An optional validator for the provided value.
 * 
 * Where other DI libraries use a *token* (such as a string, or a class), `tidi` uses a `Dependency`. This allows 
 * for a consistent interface when working with discrete values vs. classes, as well as providing type information 
 * for the value. A `Dependency` can also provide a validator function, which is used by `Scope` to check the value returned by the provider.
 * 
 * @example
 * 
 * ```ts
 * import { Dependency, dependency } from 'tidi';
 * 
 * // A Dependency is just an object, so you can define one like this:
 * const DatabaseURLDependency: Dependency<string> = {
 *  name: 'DATABASE_URL',
 *  validate: (value) => new URL(value),
 * };
 * 
 * // You can also use the `dependency` helper function
 * const DatabaseURLDependency = dependency<string>({
 *  name: 'DATABASE_URL',
 *  validate: (value) => new URL(value),
 * });
 * ```
*/

// @ts-expect-error T is 'unused' but is required for the type to be correct
export interface Dependency<T = unknown> {
  /**
   * A human-readable identifier for the dependency.
   */
  readonly name: string;

  /**
   * A validator for the provided value. Can either throw an error, or return
   * a value; if a value other than `undefined` is returned, it will be cast
   * to a Boolean to determine if the value is valid.
   * 
   * @param value 
   * @returns 
   */
  readonly validate?: (value: unknown) => unknown;
}

/**
 * Extracts the type of a dependency.
 * 
 * @example
 * ```ts
 * import { Dependency, DependencyType } from 'tidi';
 * 
 * const DatabaseURLDependency = dependency<string>({ ... });
 * 
 * type DatabaseURL = DependencyType<typeof DatabaseURLDependency>;
 * // type DatabaseURL = string
 * ```
 */
export type DependencyType<D> = D extends Dependency<infer T> ? T : never;

/**
 * @ignore
 * 
 * Extracts the types of a tuple of dependencies.
 */
export type DependencyTypes<D extends [...unknown[]]> = D extends [infer Head, ...infer Tail]
  ? [DependencyType<Head>, ...DependencyTypes<Tail>]
  : [];


/**
 * Defines a `Dependency`. This is really just a helper function to give a 
 * consistent interface for creating dependencies and providers.
 * 
 * @param options 
 * @returns 
 * 
 * @example
 * ```ts
 * import { dependency } from 'tidi';
 * 
 * const DatabaseURLDependency = dependency<URL>({
 *  name: 'DATABASE_URL',
 *  validate: (value) => value instanceof URL,
 * });
 * ```
 */
export function dependency<T>(options: Dependency<T>): Dependency<T> {
  return Object.freeze(options);
}
  