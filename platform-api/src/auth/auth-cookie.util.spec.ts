import {
  AUTH_COOKIE_NAME,
  DEFAULT_AUTH_SESSION_TTL_SECONDS,
  getAuthSessionTtlSeconds,
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
      maxAge: DEFAULT_AUTH_SESSION_TTL_SECONDS * 1000,
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
      maxAge: DEFAULT_AUTH_SESSION_TTL_SECONDS * 1000,
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
        maxAge: DEFAULT_AUTH_SESSION_TTL_SECONDS * 1000,
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
        maxAge: DEFAULT_AUTH_SESSION_TTL_SECONDS * 1000,
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

  it('reads the session ttl from AUTH_SESSION_TTL_SECONDS', () => {
    expect(
      getAuthSessionTtlSeconds(
        createConfigService({ AUTH_SESSION_TTL_SECONDS: '1800' }),
      ),
    ).toBe(1800);
  });

  it('falls back to the default ttl when the variable is unset', () => {
    expect(getAuthSessionTtlSeconds(createConfigService({}))).toBe(
      DEFAULT_AUTH_SESSION_TTL_SECONDS,
    );
  });

  it.each(['0', 'abc', ''])(
    'falls back to the default ttl for the invalid value %p',
    (value) => {
      expect(
        getAuthSessionTtlSeconds(
          createConfigService({ AUTH_SESSION_TTL_SECONDS: value }),
        ),
      ).toBe(DEFAULT_AUTH_SESSION_TTL_SECONDS);
    },
  );

  it('keeps the cookie maxAge in sync with the configured ttl', () => {
    const options = getAuthCookieOptions(
      createConfigService({ ENV: 'local', AUTH_SESSION_TTL_SECONDS: '1800' }),
    );

    expect(options.maxAge).toBe(1800 * 1000);
  });
});
