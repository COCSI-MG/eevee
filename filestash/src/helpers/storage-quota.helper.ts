export async function isStorageUsageHigherThan90Percent(): Promise<[
  result: boolean,
  err: null | string
]> {
  if (typeof window !== undefined) {
    return [
      false,
      null
    ];
  }
  if (window.navigator && window.navigator?.storage.estimate) {
    const { quota, usage } = await navigator.storage.estimate();
    if (!quota || !usage) {
      console.warn('Quota or usage storage not avaliable');
      return [
        false,
        null
      ];
    }
    const usageSpace = (quota / usage) * 100;
    if (quota < 0) {
      return [
        false,
        "Quota is than 0, unexpected behavior"
      ];
    }
    if (usageSpace > 0.9) {
      console.warn(
        `Disk usage is higher than 90% usage ${usage} - quota ${quota} - usage ${usage.toFixed(2)}`
      );
      return [
        true, 
        null
      ];
    }
    return [
      false,
      null
    ];
  }
}
