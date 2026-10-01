import { LruCache } from './lru-cache';

describe('LruCache', () => {
  it('sets, gets, expires, and deletes values', async () => {
    const cache = new LruCache();
    await cache.set('key', { value: 42 }, 1);
    expect(await cache.get<{ value: number }>('key')).toEqual({ value: 42 });
    await cache.del('key');
    expect(await cache.get('key')).toBeUndefined();
    await cache.set('expiring', 'value', 0.01);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(await cache.get('expiring')).toBeUndefined();
  });
});
