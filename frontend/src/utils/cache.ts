// Simple cache implementation for search results
interface CacheEntry {
    data: any;
    timestamp: number;
    expiresAt: number;
}

class SearchCache {
    private cache = new Map<string, CacheEntry>();
    private defaultTTL = 5 * 60 * 1000; // 5 minutes

    set(key: string, data: any, ttl: number = this.defaultTTL): void {
        const now = Date.now();
        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + ttl
        });
    }

    get(key: string): any | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }

    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    getStats() {
        const now = Date.now();
        const entries = Array.from(this.cache.values());
        const valid = entries.filter(entry => entry.expiresAt > now);
        const expired = entries.length - valid.length;

        return {
            total: entries.length,
            valid: valid.length,
            expired,
            oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null
        };
    }
}

// Export singleton instance
export const searchCache = new SearchCache();
export default searchCache;
