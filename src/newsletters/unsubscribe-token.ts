import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Stateless unsubscribe token: an HMAC of the subscriber's email.
 * Links cannot be forged for other addresses, and no database column is needed.
 */
export function unsubscribeToken(email: string, secret: string): string {
  return createHmac('sha256', secret).update(`newsletter-unsubscribe:${email.trim().toLowerCase()}`).digest('base64url');
}

export function isValidUnsubscribeToken(email: string, token: string | undefined, secret: string): boolean {
  if (!email || !token) return false;
  const expected = Buffer.from(unsubscribeToken(email, secret));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
