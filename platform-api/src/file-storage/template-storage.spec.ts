import { storeTemplateFile } from './template-storage';

describe('committed template manifest reconciliation', () => {
  const oldEnv = { ...process.env };
  afterEach(() => { jest.restoreAllMocks(); process.env = { ...oldEnv }; });

  it.each<Record<string, { digest: string; size: number }>>([{}, { 'confirmed.csv': { digest: 'b'.repeat(64), size: 1 } }])(
    'does not adopt a phantom workspace file after SQL rollback',
    async (committed) => {
      process.env.EEVEE_STORAGE_SIGNING_SECRET = 's'.repeat(32);
      process.env.EEVEE_STORAGE_URL = 'http://127.0.0.1:3020';
      let workspace: any = { 'rolled-back.csv': { digest: 'a'.repeat(64), size: 1 } };
      jest.spyOn(global, 'fetch').mockImplementation(async (input, options) => {
        const url = String(input);
        if (url.includes('/blobs/')) return new Response('{}');
        if (url.endsWith('/workspace') && options?.method === 'PUT') {
          workspace = JSON.parse(String(options.body)).files;
          return new Response(JSON.stringify({ revision: 2 }));
        }
        if (url.endsWith('/workspace')) return new Response(JSON.stringify({
          scope: 'eevee-template-t42', revision: 1, files: workspace,
        }));
        return new Response(JSON.stringify({
          scope: 'eevee-template-t42', id: 'c'.repeat(64), kind: 'template',
          revision: 2, files: workspace,
        }));
      });
      const snapshot = await storeTemplateFile(42, 'retry.csv', Buffer.from('x'), committed);
      expect(Object.keys(snapshot.files).sort()).toEqual([...Object.keys(committed), 'retry.csv'].sort());
      expect(snapshot.files['rolled-back.csv']).toBeUndefined();
    },
  );
});
