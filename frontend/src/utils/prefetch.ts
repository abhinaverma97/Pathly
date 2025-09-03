'use client';

import searchCache from './cache';

/**
 * Prefetches search results for commonly searched terms and stores in cache
 * Call this function during idle time to improve user experience
 */
export async function prefetchCommonSearches(location: { latitude: number; longitude: number }) {
    if (!location || !location.latitude || !location.longitude) {
        return;
    }

    // List of common search terms
    const commonSearches = [
        'coffee',
        'restaurants',
        'atms',
        'gas stations',
        'pharmacies'
    ];

    try {
        // Only prefetch if cache is relatively empty (avoid unnecessary API calls)
        if (searchCache.size() < 3) {
            // Prefetch one common search term at a time
            const termToFetch = commonSearches[Math.floor(Math.random() * commonSearches.length)];

            const cacheKey = `search_${termToFetch}_${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}`;

            // Skip if already in cache or being prefetched
            if (searchCache.has(cacheKey)) {
                return;
            }

            // Mark as being prefetched to prevent duplicate requests
            searchCache.set(cacheKey, { loading: true }, 30000); // 30 second temp cache

            // Dispatch prefetch start event
            window.dispatchEvent(new CustomEvent('prefetch-start'));

            console.log(`Prefetching results for: ${termToFetch}`);

            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: termToFetch,
                    location
                }),
                // Set 2 minute timeout for prefetch requests
                signal: AbortSignal.timeout(120000) // 120 seconds = 2 minutes
            });

            if (!response.ok) {
                throw new Error(`Prefetch failed: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                // Store the results in cache with a long TTL (1 hour)
                searchCache.set(cacheKey, data, 60 * 60 * 1000);
                console.log(`Successfully prefetched and cached: ${termToFetch}`);
            }

            // Dispatch prefetch end event
            window.dispatchEvent(new CustomEvent('prefetch-end'));
        }
    } catch (error) {
        // Silently fail - prefetching is optional
        console.warn('Prefetch failed:', error);
        // Dispatch prefetch end event even on error
        window.dispatchEvent(new CustomEvent('prefetch-end'));
    }
}

/**
 * Gets a search result from cache if available
 * @param query The search query
 * @param location The location object
 * @returns The cached results or null if not found
 */
export function getCachedSearchResults(query: string, location: { latitude: number; longitude: number }) {
    if (!query || !location) return null;

    // Create a cache key based on the query and approximate location
    // We round coordinates to 3 decimal places (~100m precision) to increase cache hits
    const cacheKey = `search_${query}_${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}`;

    return searchCache.get(cacheKey);
}
