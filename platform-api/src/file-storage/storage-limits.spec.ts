describe('template storage limits', () => {
  const original = { ...process.env };
  afterEach(() => { process.env = { ...original }; });

  it('uses deployment values to enforce the per-file limit', async () => {
    process.env.STORAGE_MAX_FILE_BYTES = '3';
    process.env.STORAGE_MAX_PROJECT_BYTES = '6';
    let storeTemplateFile: typeof import('./template-storage').storeTemplateFile;
    jest.isolateModules(() => {
      storeTemplateFile = require('./template-storage').storeTemplateFile;
    });
    await expect(storeTemplateFile!(1, 'data.csv', Buffer.from('1234')))
      .rejects.toThrow('Template resource exceeds 3 bytes');
  });

  it('rejects invalid deployment limits', () => {
    process.env.STORAGE_MAX_FILE_BYTES = 'invalid';
    expect(() => require('./storage-limits').storageLimits())
      .toThrow('STORAGE_MAX_FILE_BYTES must be a positive integer');
  });

  it('reads settings loaded after the module was imported', () => {
    const { storageLimits } = require('./storage-limits');
    process.env.STORAGE_MAX_FILE_BYTES = '123';
    expect(storageLimits().maxFileBytes).toBe(123);
  });
});
