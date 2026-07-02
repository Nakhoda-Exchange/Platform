import type { Token } from "./token";

type Provider<T> = (container: Container) => T;

interface Registration<T> {
  provider: Provider<T>;
  singleton: boolean;
  instance?: T;
}

/**
 * Minimal, type-safe DI container. Providers receive the container so they can
 * resolve their own dependencies, which keeps wiring explicit and testable
 * (build a fresh container with fake adapters in tests).
 */
export class Container {
  private readonly registrations = new Map<symbol, Registration<unknown>>();

  register<T>(
    token: Token<T>,
    provider: Provider<T>,
    options: { singleton?: boolean } = {},
  ): this {
    this.registrations.set(token.symbol, {
      provider: provider as Provider<unknown>,
      singleton: options.singleton ?? false,
    });
    return this;
  }

  /** Register a provider whose instance is created once and cached. */
  registerSingleton<T>(token: Token<T>, provider: Provider<T>): this {
    return this.register(token, provider, { singleton: true });
  }

  resolve<T>(token: Token<T>): T {
    const registration = this.registrations.get(token.symbol) as
      Registration<T> | undefined;

    if (!registration) {
      throw new Error(`No provider registered for token "${token.name}"`);
    }

    if (!registration.singleton) {
      return registration.provider(this);
    }

    if (registration.instance === undefined) {
      registration.instance = registration.provider(this);
    }
    return registration.instance;
  }
}
