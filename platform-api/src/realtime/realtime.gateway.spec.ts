import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { RealtimeGateway } from './realtime.gateway';

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  const jwtService = { verify: jest.fn() };

  const buildClient = (cookie?: string) =>
    ({
      id: 'client-1',
      handshake: { headers: { cookie } },
      join: jest.fn(),
      disconnect: jest.fn(),
    }) as unknown as Socket & { join: jest.Mock; disconnect: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
    gateway = new RealtimeGateway(jwtService as unknown as JwtService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const nowInSeconds = () => Math.floor(Date.now() / 1000);

  it('rejects a connection without the auth cookie', () => {
    const client = buildClient();

    gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.join).not.toHaveBeenCalled();
  });

  it('rejects a connection whose token does not verify', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    const client = buildClient('eevee_auth=token');

    gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('drops the socket when the token expires', () => {
    jwtService.verify.mockReturnValue({
      userId: 7,
      exp: nowInSeconds() + 900,
    });
    const client = buildClient('eevee_auth=token');

    gateway.handleConnection(client);
    expect(client.disconnect).not.toHaveBeenCalled();

    jest.advanceTimersByTime(899_000);
    expect(client.disconnect).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1_000);
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('drops a socket that connects with an already expired token', () => {
    jwtService.verify.mockReturnValue({
      userId: 7,
      exp: nowInSeconds() - 1,
    });
    const client = buildClient('eevee_auth=token');

    gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('keeps a socket whose token carries no expiry', () => {
    jwtService.verify.mockReturnValue({ userId: 7 });
    const client = buildClient('eevee_auth=token');

    gateway.handleConnection(client);
    jest.advanceTimersByTime(30 * 24 * 60 * 60 * 1000);

    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('clears the timer when the client leaves first', () => {
    jwtService.verify.mockReturnValue({
      userId: 7,
      exp: nowInSeconds() + 900,
    });
    const client = buildClient('eevee_auth=token');

    gateway.handleConnection(client);
    gateway.handleDisconnect(client);
    jest.advanceTimersByTime(900_000);

    expect(client.disconnect).not.toHaveBeenCalled();
  });
});
