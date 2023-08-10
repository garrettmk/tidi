import { Dependency, DependencyType, dependency } from "./dependency";
import { Provider } from "./provider";

/**
 * A special `Dependency` that represents the scope itself.
 */
export const ScopeDependency = dependency<Scope>({
  name: 'SCOPE',
  validate: (value) => {
    if (!(value instanceof Scope))
      throw new Error(`Expected value to be a Scope, got ${typeof value}`);
  },
});


/**
 * A `Scope` is a container for providers. It can be used to resolve dependencies,
 * and to create sub-scopes with their own providers.
 * 
 * @example
 * 
 * ```ts
 * const myScope = new Scope([
 *  MyDependencyProvider,
 *  MyOtherDependencyProvider,
 *  ...
 * ]);
 * 
 * // Resolve a dependency asynchronously
 * await myScope.resolve(MyDependency);
 * 
 * // If a dependency is already resolved, it can be retrieved synchronously
 * // Otherwise an error will be thrown
 * myScope.get(MyDependency);
 * 
 * // Create a sub-scope that overrides part of the parent scope
 * const subScope = new Scope(myScope, [
 *  AnotherProviderForMyOtherDependency
 * ]);
 * ```
 */
export class Scope {
  protected readonly parent?: Scope;
  protected readonly cache: Map<Dependency, any>;
  protected readonly providers: Map<Dependency, Provider>;


  /**
   * Create a new scope.
   * 
   * @param parent The parent scope
   * @param providers The scope's providers
   */
  constructor(parentOrProviders?: Scope | Provider[])
  constructor(parent: Scope, providers?: Provider[])
  constructor(parentOrProviders?: Scope | Provider[], maybeProviders?: Provider[]) {
    const parent = parentOrProviders instanceof Scope ? parentOrProviders : undefined;
    const providers = parentOrProviders instanceof Scope ? maybeProviders : parentOrProviders;

    this.parent = parent;
    this.providers = new Map(providers?.map((provider) => [provider.provides, provider]));
    this.cache = new Map();
  }


  /**
   * Resolve a dependency or array of dependencies. If the dependency is resolved
   * in this scope (not a parent scope), the resolved value will be cached.
   * 
   * @param dependency 
   * @returns 
   */
  public async resolve(dependencies: Dependency[]): Promise<unknown[]>;
  public async resolve<T>(dependency: Dependency<T>): Promise<T>;
  public async resolve<T>(dependencyOrArray: Dependency<T> | Dependency[]): Promise<T | unknown[]> {
    // If it's an array, resolve them each individually
    if (Array.isArray(dependencyOrArray)) {
      const dependencies = dependencyOrArray;

      return await Promise.all(
        dependencies.map((dependency) => this.resolve(dependency))
      );
    }

    // If it's a single dependency...
    const dependency = dependencyOrArray;

    // If the dependency is the scope itself, return this scope
    if (dependency === ScopeDependency)
      return this as unknown as T;

    // If the dependency is already cached, return the cached value
    if (this.cache.has(dependency))
      return this.cache.get(dependency);

    // If the dependency is provided in this scope, resolve it and cache the value
    if (this.providers.has(dependency)) {
      const provider = this.getProvider(dependency);
      const value = await this.useProvider(provider);

      this.validate(value, dependency);
      this.cache.set(dependency, value);

      return value;
    }

    // If the dependency is not provided in this scope, try to resolve it in the parent scope
    if (this.parent)
      return await this.parent.resolve(dependency);

    throw new Error(`Unable to resolve dependency ${dependency?.name ?? dependency}`);
  }


  /**
   * Clears the cached value for all dependencies, and resolves them again.
   */
  public async resolveAll(): Promise<void> {
    // Clear the cache
    this.cache.clear();

    // Sort the providers by the number of dependencies they require, least to most
    const providers = Array.from(this.providers.values());
    const byRequirementsLength = (a: Provider, b: Provider) => (a.requires?.length ?? 0) - (b.requires?.length ?? 0);
    providers.sort(byRequirementsLength);

    // Resolve each provider, in order
    for (const provider of providers) {
      if (!this.cache.has(provider.provides)) {
        const value = await this.useProvider(provider);
        this.validate(value, provider.provides);
        this.cache.set(provider.provides, value);
      }
    }
  }


  /**
   * Return the cached value for a dependency, or throw an error if no value
   * 
   * @param dependency The dependency to get the value for
   * @returns The value
   */
  public get(dependencies: Dependency[]): unknown[];
  public get<T>(dependency: Dependency<T>): T;
  public get<T>(dependencyOrArray: Dependency<T> | Dependency[]): T | unknown[] {
    if (Array.isArray(dependencyOrArray))
      return dependencyOrArray.map((dependency) => this.get(dependency));

    if (dependency === ScopeDependency)
      return this as unknown as T;

    if (this.cache.has(dependency))
      return this.cache.get(dependency);

    if (this.parent)
      return this.parent.get(dependency);

    throw new Error(`No value resolved for dependency ${dependency.name}`);
  }

  /**
   * Get the provider for a dependency, or throw an error if no provider exists
   * 
   * @param dependency 
   * @returns the provider
   */
  public getProvider<D extends Dependency>(dependency: D): Provider<D> {
    if (!this.providers.has(dependency))
      throw new Error(`No provider found for dependency ${dependency.name}`);

    return this.providers.get(dependency) as Provider<D>;
  }

  /**
   * Use the given provider to generate a value.
   * 
   * @param provider 
   * @returns 
   */
  public async useProvider<D extends Dependency>(provider: Provider<D>): Promise<DependencyType<D>> {
    this.checkForCircularDependencies(provider);

    const dependencies = await this.resolve(provider.requires ?? []);
    const value = await provider.use(...dependencies as []);

    return value;
  }

  /**
   * Returns true if the dependency is resolved in this scope (not a parent scope).
   * 
   * @param dependency 
   * @returns 
   */
  public isResolved(dependency: Dependency): boolean {
    return this.cache.has(dependency);
  }


  /**
   * Returns true if all providers in this scope have been resolved.
   * 
   * @returns 
   */
  public isAllResolved(): boolean {
    const providers = Array.from(this.providers.values());
    return providers.every((provider) => this.isResolved(provider.provides));
  }


  /**
   * Validate a value against a dependency's validation function. Throws an error
   * if the value fails validation.
   * 
   * @param value The value to validate
   * @param dependency The dependency to validate against
   * @returns 
   */
  public validate(value: unknown, dependency: Dependency): void {
    if (!dependency.validate)
      return;

    let isValid: boolean;
    try {
      isValid = Boolean(dependency.validate(value));
    } catch (cause) {
      throw new Error(`Dependency ${dependency.name} failed validation: ${JSON.stringify(cause)}`, { cause });
    }

    if (!isValid)
      throw new Error(`Dependency ${dependency.name} failed validation`);
  }


  /**
   * Throws an `Error` if any of the given provider's dependencies, either directly or
   * indirectly, depend on `provider`.
   * 
   * @param provider 
   * @param _start 
   */
  public checkForCircularDependencies(provider: Provider, _start: Provider = provider): void {
    for (const dependency of provider.requires ?? []) {
      if (dependency === ScopeDependency)
        continue;

      const dependencyProvider = this.getProvider(dependency);

      if (dependencyProvider === _start)
        throw new Error(`Provider for ${provider.provides.name} closes a loop with ${dependency.name}`);

      this.checkForCircularDependencies(dependencyProvider, _start);
    }
  }


  /**
   * Get the dependencies that require the given dependency, directly or indirectly.
   * 
   * @param dependency 
   * @returns an array of dependencies
   */
  public getDependents(dependency: Dependency, _start: Dependency = dependency): Dependency[] {
    const providers = Array.from(this.providers.values());

    // Does this dependency close a loop?
    const throwIfClosesLoop = (p: Provider) => {
      if (p.requires?.includes(_start))
        throw new Error(`Provider for ${p.provides.name} closes a loop with ${_start.name}`);

      return p;
    };

    // Does the provider require the dependency?
    const requiresDependency = (p: Provider) => p.requires?.includes(dependency) ?? false;

    // Get the dependencies that require the value provided by the provider
    const getNextDependents = (p: Provider) => this.getDependents(p.provides);

    // Find the providers that require the dependency, and get their dependents
    return providers
      .map(throwIfClosesLoop)
      .filter(requiresDependency)
      .flatMap(getNextDependents);
  }


  /**
   * Clears the cached value for the dependency, and resolves it again.
   * The dependency's dependents will also be invalidated.
   * 
   * @param dependency The dependency to invalidate
   */
  public async invalidate(dependency: Dependency): Promise<void> {
    // If we have a provider for this dependency, clear the cache and resolve it again
    if (this.providers.has(dependency)) {
      this.cache.delete(dependency);
      await this.resolve(dependency);
    }

    // If we have any dependents, invalidate them too
    const dependents = this.getDependents(dependency);
    for (const dependent of dependents)
      await this.invalidate(dependent);
  }

}

