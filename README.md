
# tidi

`tidi` is a minimal dependency injection library written for Typescript. It's meant to provide a simple DI mechanism that is easy to use, and works in any environment (node, browser, testing, etc...)

## Features

- Fully typed dependencies and providers
- Dependency validation
- Synchronous or asynchronous dependency resolution
- Doesn't rely on experimental language features (like decorators)


## Installation

Install `tidi` with npm:

```bash
  npm install tidi
```

## Usage/Examples

`tidi` works with three main entities: `Dependency`, `Provider` and `Scope`:
- `Dependency` describes a value, and optionally a validator
- `Provider` provides a value described by a `Dependency`
- `Scope` manages a group of providers, providing resolved values

In the following example, we declare two dependencies, `DatabaseURLDependency` and `DatabaseClientDependency`, as well as providers for those values. Note that `DatabaseClientProvider` needs the value from `DatabaseURLProvider` before it can provide its own value:

```javascript
import { dependency, provider, Scope } from 'tidi';

// Declare dependencies using the dependency() helper
const DatabaseURLDependency = dependency<string>({
    name: 'DATABASE_URL',
    validate: value => new URL(value)                       // validators can throw an exception...
});

const DatabaseClientDependency = dependency<DatabaseClient>({
    name: 'DATABASE_CLIENT',
    validate: value => value instanceof DatabaseClient    // ...or return a truthy/falsy value
});


// Declare providers using the provider() helper
const DatabaseURLProvider = provider({
    provides: DatabaseURLDependency,
    use: async () => 'http://localhost:5432'    // Or from an env variable, for example
});

const DatabaseClientProvider = provider({
    provides: DatabaseClientDependency,
    requires: [DatabaseURLDependency],            // Providers can have their own dependencies...
    use: async (url) => new DatabaseClient(url)   // ...whose values are then passed as arguments to use()
});


// Create a Scope
const scope = new Scope([DatabaseURLProvider, DatabaseClientProvider]);

// Use the Scope to resolve values. In this case, DatabaseURLDependency
// is resolved first, because it is required by DatabaseClientProvider
const client = await scope.resolve(DatabaseClientDependency);

// Values that have already been resolved are cached, and can be retrieved synchronously using get()
// If the value has *not* been resolved, an error will be thrown
const url = scope.get(DatabaseURLDependency);

// You can resolve all of a Scope's providers at once using resolveAll()
await scope.resolveAll();

// Scopes can also be nested. If a Scope doesn't have a provider for a certain value,
// it will try to resolve it using it's parent, if available
const childScope = new Scope(scope);
const clientFromChild = await childScope.resolve(DatabaseClientDependency);

console.log(client === clientFromChild); // true
```

Please [see the documentation](https://garrettmk.github.io/tidi) for more information.
## License

[MIT](https://choosealicense.com/licenses/mit/)

