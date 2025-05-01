export async function isStorageUsageHigherThan90Percent(): Promise<boolean> {
  if (typeof window !== undefined) {
    return false;
  }
  if (window.navigator && window.navigator?.storage.estimate) {
    const { quota, usage } = await navigator.storage.estimate();
    if (!quota || !usage) {
      console.warn('Quota or usage storage not avaliable');
      return false;
    }
    const usageSpace = (quota / usage) * 100;
    if (quota < 0) {
      console.error('Quota is 0, unexpected behavior');
      return false;
    }
    if (usageSpace > 0.9) {
      console.warn(
        `Disk usage is higher than 90% usage ${usage} - quota ${quota} - usage ${usage.toFixed(2)}`
      );
      return true;
    }
    return false;
  }
}
