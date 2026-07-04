import {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  getAuthCookieOptions,
  getTokenFromCookieHeader,
  parseCookieHeader,
  setAuthCookie,
} from './auth-cookie.util';

describe('auth cookie util', () => {
  const createConfigService = (values: Record<string, string | undefined>) =>
    ({
      get: jest.fn((key: string) => values[key]),
    }) as never;

  it('builds local cookie options with the least restrictive settings needed', () => {
    const options = getAuthCookieOptions(
      createConfigService({ ENV: 'local' }),
    );

    expect(options).toEqual({
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: false,
      domain: undefined,
      maxAge: 60 * 60 * 1000,
    });
  });

  it('builds production cookie options for eeveecodelab.online', () => {
    const options = getAuthCookieOptions(
      createConfigService({
        ENV: 'production',
        AUTH_COOKIE_DOMAIN: '.eeveecodelab.online',
      }),
    );

    expect(options).toEqual({
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: true,
      domain: '.eeveecodelab.online',
      maxAge: 60 * 60 * 1000,
    });
  });

  it('writes the auth cookie to the response on login', () => {
    const response = {
      cookie: jest.fn(),
    } as any;

    setAuthCookie(
      response,
      'signed-token',
      createConfigService({ ENV: 'local' }),
    );

    expect(response.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      'signed-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: false,
        maxAge: 60 * 60 * 1000,
      }),
    );
  });

  it('clears the auth cookie from the response on logout', () => {
    const response = {
      clearCookie: jest.fn(),
    } as any;

    clearAuthCookie(
      response,
      createConfigService({
        ENV: 'production',
        AUTH_COOKIE_DOMAIN: '.eeveecodelab.online',
      }),
    );

    expect(response.clearCookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: true,
        domain: '.eeveecodelab.online',
        maxAge: 60 * 60 * 1000,
      }),
    );
  });

  it('parses cookies from the cookie header', () => {
    expect(
      parseCookieHeader(`foo=bar; ${AUTH_COOKIE_NAME}=signed-token`)[AUTH_COOKIE_NAME],
    ).toBe('signed-token');
  });

  it('extracts the auth cookie from the raw cookie header', () => {
    expect(
      getTokenFromCookieHeader(`foo=bar; ${AUTH_COOKIE_NAME}=signed-token`),
    ).toBe('signed-token');
  });
});
