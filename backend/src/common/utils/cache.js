/**
 * Simple, high-performance In-Memory TTL Cache
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlSeconds = 86400) { // Default 24 hours
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

export const memoryCache = new MemoryCache();
export default memoryCache;
