/**
 * Simple in-memory cache for music data
 * Can be replaced with Redis or other caching solutions
 */

interface CacheItem {
  data: string;
  expiry: number;
}

class MusicCache {
  private cache: Map<string, CacheItem> = new Map();

  set(key: string, data: string, ttl: number = 3600): void {
    const expiry = Date.now() + ttl * 1000;
    this.cache.set(key, { data, expiry });
    
    // Clean up expired items periodically
    this.cleanup();
  }

  get(key: string): string | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    // Only cleanup if cache size exceeds 1000 items
    if (this.cache.size < 1000) {
      return;
    }

    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const musicCache = new MusicCache();
