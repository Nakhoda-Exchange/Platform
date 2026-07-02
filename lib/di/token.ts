/**
 * A typed injection token. The phantom `_type` carries the resolved type so the
 * container can stay fully type-safe without decorators or reflect-metadata.
 */
export interface Token<T> {
  readonly symbol: symbol;
  readonly name: string;
  readonly _type?: T;
}

export function token<T>(name: string): Token<T> {
  return { symbol: Symbol(name), name };
}
