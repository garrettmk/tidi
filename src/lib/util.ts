import { Dependency, DependencyType } from './dependency';
import { Provider, provider } from './provider';


export function EnvProvider<D extends Dependency>(provides: D, key: string, use: (value: string | undefined) => DependencyType<D> = identity as any): Provider<D> {
  return provider({
    provides,
    use: () => use(getEnv(key))
  });
}

export function getEnv(key: string, defaultValue?: string): string {
  const fromImportMeta = import.meta.env[key] ?? null;
  const fromProcessEnv = process.env[key] ?? null;

  return fromImportMeta ?? fromProcessEnv ?? defaultValue ?? '';
}

export function identity<T>(value: T): T {
  return value;
}