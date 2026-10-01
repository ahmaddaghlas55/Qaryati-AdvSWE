import { LRUCache } from 'lru-cache';

import type { Cache } from './cache';

export class LruCache implements Cache {
  private readonly cache = new LRUCache<string, {}>({ max: 500 });

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get(key) as T | undefined;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.cache.set(key, value as {}, { ttl: ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
}
