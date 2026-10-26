import { isValidUnsubscribeToken, unsubscribeToken } from './unsubscribe-token';

describe('unsubscribe tokens', () => {
  const secret = 'a-secure-secret-that-is-longer-than-thirty-two-characters';

  it('accepts the token issued for the same email (case-insensitive)', () => {
    expect(isValidUnsubscribeToken('reader@example.com', unsubscribeToken('Reader@Example.com', secret), secret)).toBe(true);
  });

  it('rejects a token issued for another email', () => {
    expect(isValidUnsubscribeToken('victim@example.com', unsubscribeToken('attacker@example.com', secret), secret)).toBe(false);
  });

  it('rejects missing or malformed tokens', () => {
    expect(isValidUnsubscribeToken('reader@example.com', undefined, secret)).toBe(false);
    expect(isValidUnsubscribeToken('reader@example.com', 'short', secret)).toBe(false);
  });
});
