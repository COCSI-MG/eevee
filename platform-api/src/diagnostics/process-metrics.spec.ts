import { startProcessMetrics } from './process-metrics';
import { EventEmitter } from 'node:events';
describe('internal process metrics', () => {
  it('requires authentication and records completion/aborted responses once without storing request data', async () => {
    // Bind an available test port, then use the actual HTTP listener.
    const net = await import('node:net');
    const reservation = net.createServer();
    await new Promise<void>(resolve => reservation.listen(0, '127.0.0.1', resolve));
    const port = (reservation.address() as import('node:net').AddressInfo).port;
    await new Promise<void>(resolve => reservation.close(() => resolve()));
    const metrics = startProcessMetrics(port, 'synthetic-secret');
    try {
      await metrics.ready;
      expect((await fetch(`http://127.0.0.1:${port}/metrics`)).status).toBe(401);
      const response = Object.assign(new EventEmitter(), { statusCode: 500, writableFinished: true });
      metrics.middleware({ url: '/student-secret', body: { code: 'sensitive' } }, response, () => {});
      response.emit('finish'); response.emit('close');
      const value = await (await fetch(`http://127.0.0.1:${port}/metrics`, { headers: { Authorization: 'Bearer synthetic-secret' } })).json();
      expect(value.memory.heapUsed).toBeGreaterThan(0);
      expect(value.requests).toMatchObject({ active: 0, completed: 1, errors: 1 });
      expect(JSON.stringify(value)).not.toMatch(/student-secret|sensitive|synthetic-secret/);
    } finally { metrics.close(); }
  });
});
