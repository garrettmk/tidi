
/**
 * Represents a dependency that can be provided by a provider.
 * 
 * @example
 * ```ts
 * const MyDependency = dependency({
 *  name: 'MY_DEPENDENCY',
 *  validate: (value) => value !== undefined,
 * });
 * ```
*/
// @ts-expect-error
export interface Dependency<T = unknown> {
  /**
   * A human-readable identifier for the dependency.
   */
  readonly name: string;

  /**
   * A validator for the provided value. Can either throw an error, or return
   * a falsy value to indicate that the value is invalid.
   * 
   * @param value 
   * @returns 
   */
  readonly validate?: (value: unknown) => unknown;
}

/**
 * Extracts the type of a dependency.
 */
export type DependencyType<D> = D extends Dependency<infer T> ? T : never;

/**
 * Extracts the types of a tuple of dependencies.
 */
export type DependencyTypes<D extends [...unknown[]]> = D extends [infer Head, ...infer Tail]
  ? [DependencyType<Head>, ...DependencyTypes<Tail>]
  : [];

/**
 * Converts a tuple of types to a tuple of dependencies
 */
export type Dependencies<U extends [...unknown[]]> = U extends [infer Head, ...infer Tail]
  ? [Dependency<Head>, ...Dependencies<Tail>]
  : [];

/**
 * Defines a `Dependency`. This is really just a helper function to give a 
 * consistent interface for creating dependencies and providers.
 * 
 * @param options 
 * @returns 
 */
export function dependency<T>(options: Dependency<T>): Dependency<T> {
  return Object.freeze(options);
}
  