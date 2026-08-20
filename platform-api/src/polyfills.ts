/* eslint-disable @typescript-eslint/no-var-requires */

(() => {
  const globalAny = globalThis as any;

  if (globalAny.crypto && typeof globalAny.crypto.randomUUID === 'function') {
    return;
  }

  try {
    const nodeCrypto = require('node:crypto');

    // Prefer the WebCrypto-compatible shape when available.
    if (
      nodeCrypto?.webcrypto &&
      typeof nodeCrypto.webcrypto.randomUUID === 'function'
    ) {
      globalAny.crypto = nodeCrypto.webcrypto;
      return;
    }

    if (typeof nodeCrypto?.randomUUID === 'function') {
      globalAny.crypto = nodeCrypto;
    }
  } catch {
    // If crypto can't be loaded, leave as-is and let the app fail fast.
  }
})();

export {};
