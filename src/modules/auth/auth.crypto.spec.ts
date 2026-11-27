import jwt from 'jsonwebtoken';

import { createAuthCrypto } from './auth.crypto';

describe('auth crypto', () => {
  const crypto = createAuthCrypto('test-secret-with-more-than-thirty-two-characters');

  it('hashes and verifies passwords with bcrypt', async () => {
    const hash = await crypto.hashPassword('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    expect(await crypto.verifyPassword('correct horse battery staple', hash)).toBeTrue();
    expect(await crypto.verifyPassword('wrong password', hash)).toBeFalse();
  });

  it('issues a signed access token with a 15 minute lifetime', () => {
    const token = crypto.createAccessToken('42');
    const payload = jwt.decode(token) as jwt.JwtPayload;
    expect(payload.exp! - payload.iat!).toBe(15 * 60);
    expect(crypto.verifyAccessToken(token)).toBe('42');
  });

  it('rejects malformed, altered, and expired access tokens', () => {
    expect(crypto.verifyAccessToken('not-a-jwt')).toBeNull();
    const token = crypto.createAccessToken('42');
    const altered = `${token.slice(0, -1)}x`;
    expect(crypto.verifyAccessToken(altered)).toBeNull();
    const expired = jwt.sign({ sub: '42', exp: Math.floor(Date.now() / 1000) - 1 },
      'test-secret-with-more-than-thirty-two-characters');
    expect(crypto.verifyAccessToken(expired)).toBeNull();
  });

  it('rejects signed tokens with missing claims or a non-15-minute lifetime', () => {
    const issuedAt = Math.floor(Date.now() / 1000);
    const noExpiry = jwt.sign({ sub: '42' }, 'test-secret-with-more-than-thirty-two-characters');
    const noSubject = jwt.sign({ iat: issuedAt, exp: issuedAt + 15 * 60 },
      'test-secret-with-more-than-thirty-two-characters');
    const wrongLifetime = jwt.sign({ sub: '42', iat: issuedAt, exp: issuedAt + 60 },
      'test-secret-with-more-than-thirty-two-characters');

    expect(crypto.verifyAccessToken(noExpiry)).toBeNull();
    expect(crypto.verifyAccessToken(noSubject)).toBeNull();
    expect(crypto.verifyAccessToken(wrongLifetime)).toBeNull();
  });

  it('creates opaque refresh tokens and stores a one-way digest', () => {
    const first = crypto.createRefreshToken();
    const second = crypto.createRefreshToken();
    expect(first).not.toBe(second);
    expect(crypto.hashRefreshToken(first)).not.toBe(first);
    expect(crypto.hashRefreshToken(first)).toBe(crypto.hashRefreshToken(first));
  });
});