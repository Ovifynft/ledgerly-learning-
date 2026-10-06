import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../src/auth/auth.guard.js';

describe('AuthGuard', () => {
  const guard = (verifyAsync: ReturnType<typeof vi.fn>) =>
    new AuthGuard({ verifyAsync } as never);
  const context = (authorization?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization } }),
      }),
    }) as never;

  it('extracts bearer tokens and exposes the verified identity', async () => {
    const verify = vi
      .fn()
      .mockResolvedValue({ sub: 7, email: 'ada@example.com' });
    const request = { headers: { authorization: 'Bearer token' } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as never;
    await expect(guard(verify).canActivate(ctx)).resolves.toBe(true);
    expect(request).toHaveProperty('user', {
      sub: 7,
      email: 'ada@example.com',
    });
  });

  it.each([undefined, 'Basic token', 'Bearer'])(
    'rejects missing or malformed authorization: %s',
    async (authorization) => {
      await expect(
        guard(vi.fn()).canActivate(context(authorization)),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    },
  );

  it('rejects invalid and expired tokens without reaching controllers', async () => {
    const verify = vi.fn().mockRejectedValue(new Error('invalid or expired'));
    await expect(
      guard(verify).canActivate(context('Bearer token')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
