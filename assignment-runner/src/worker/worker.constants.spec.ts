import { normalizeWorkerImageReference } from './worker.constants';

describe('normalizeWorkerImageReference', () => {
  it.each([
    ['docker.io/library/worker:local', 'docker.io/library/worker:local'],
    ['registry.internal:5000/worker', 'registry.internal:5000/worker:latest'],
    ['registry.internal/worker@sha256:abc', 'registry.internal/worker@sha256:abc'],
  ])('preserves an explicit reference', (input, expected) => {
    expect(normalizeWorkerImageReference(input)).toBe(expected);
  });
});
