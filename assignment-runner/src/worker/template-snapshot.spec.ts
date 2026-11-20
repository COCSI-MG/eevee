import { workerTemplateSnapshotAccess } from './template-snapshot';

describe('workerTemplateSnapshotAccess', () => {
  const oldSecret = process.env.EEVEE_STORAGE_SIGNING_SECRET;
  const oldUrl = process.env.EEVEE_WORKER_STORAGE_URL;

  beforeEach(() => {
    process.env.EEVEE_STORAGE_SIGNING_SECRET = 's'.repeat(32);
    process.env.EEVEE_WORKER_STORAGE_URL = 'http://source-storage:3020';
  });

  afterAll(() => {
    if (oldSecret === undefined) delete process.env.EEVEE_STORAGE_SIGNING_SECRET;
    else process.env.EEVEE_STORAGE_SIGNING_SECRET = oldSecret;
    if (oldUrl === undefined) delete process.env.EEVEE_WORKER_STORAGE_URL;
    else process.env.EEVEE_WORKER_STORAGE_URL = oldUrl;
  });

  it('issues a read-only, five-minute grant bound to exactly one template snapshot', () => {
    const now = Math.floor(Date.now() / 1000);
    const grant = workerTemplateSnapshotAccess({
      scope: 'eevee-template-t7',
      id: 'a'.repeat(64),
      kind: 'template',
    });
    const [payload] = grant.token.split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

    expect(grant.url).toBe('http://source-storage:3020');
    expect(claims).toEqual(expect.objectContaining({
      scope: 'eevee-template-t7',
      snapshotId: 'a'.repeat(64),
      permissions: ['read'],
    }));
    expect(claims.exp).toBeGreaterThanOrEqual(now + 299);
    expect(claims.exp).toBeLessThanOrEqual(now + 301);
  });
});
