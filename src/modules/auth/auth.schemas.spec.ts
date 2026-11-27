import { loginBodySchema, logoutBodySchema, refreshBodySchema } from './auth.schemas';

describe('auth request schemas', () => {
  it('normalizes email and accepts a valid password', () => {
    expect(loginBodySchema.parse({
      email: '  MEMBER@example.com ',
      password: 'valid password',
    })).toEqual({ email: 'member@example.com', password: 'valid password' });
  });

  it('rejects invalid email, missing passwords, and passwords over bcrypt byte limit', () => {
    expect(loginBodySchema.safeParse({ email: 'bad', password: 'x' }).success).toBeFalse();
    expect(loginBodySchema.safeParse({ email: 'member@example.com' }).success).toBeFalse();
    expect(loginBodySchema.safeParse({
      email: 'member@example.com',
      password: 'é'.repeat(37),
    }).success).toBeFalse();
  });

  it('requires an opaque token field for refresh and logout', () => {
    expect(refreshBodySchema.safeParse({ refreshToken: 'short' }).success).toBeFalse();
    expect(logoutBodySchema.safeParse({ refreshToken: 'short' }).success).toBeFalse();
    expect(refreshBodySchema.safeParse({ refreshToken: 'r'.repeat(32) }).success).toBeTrue();
  });
});