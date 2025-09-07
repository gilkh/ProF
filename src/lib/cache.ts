// Simple in-memory cache for frequently accessed data
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class DataCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_EXPIRY): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.expiresIn) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create a singleton instance
export const dataCache = new DataCache();

// Cache key generators
export const cacheKeys = {
  serviceOrOffer: (id: string) => `service_offer_${id}`,
  reviews: (vendorId: string) => `reviews_${vendorId}`,
  serviceOrOfferWithReviews: (id: string) => `service_offer_reviews_${id}`,
  vendorProfile: (id: string) => `vendor_profile_${id}`,
  servicesAndOffers: (filters?: string) => `services_offers_${filters || 'all'}`,
};

// Cleanup expired cache items every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    dataCache.cleanup();
  }, 10 * 60 * 1000);
}