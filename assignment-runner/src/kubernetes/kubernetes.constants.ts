export const DEFAULT_NAMESPACE: string =
  process.env.K8S_NAMESPACE?.trim() || 'default';

export const JOB_IMAGE_PULL_POLICY: string =
  process.env.K8S_JOB_IMAGE_PULL_POLICY?.trim() || 'Always';

export const JOB_IMAGE_PULL_SECRETS: string[] =
  (process.env.K8S_JOB_IMAGE_PULL_SECRETS || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const parseNodeSelector = (): Record<string, string> | null => {
  const raw = process.env.K8S_JOB_NODE_SELECTOR?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
};

export const JOB_NODE_SELECTOR: Record<string, string> | null =
  parseNodeSelector();

export enum K8S_JOB_STATUS {
  PENDING = 'Pending',
  RUNNING = 'Running',
  SUCCEEDED = 'Succeeded',
  FAILED = 'Failed',
  UNKNOWN = 'Unknown',
}
