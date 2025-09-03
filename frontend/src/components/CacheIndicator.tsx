'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Zap, Database, Clock } from 'lucide-react';
import { searchCache } from '@/utils/cache';

interface CacheIndicatorProps {
    query?: string;
    className?: string;
}

export default function CacheIndicator({ query, className = '' }: CacheIndicatorProps) {
    const [cacheStats, setCacheStats] = useState({
        total: 0,
        valid: 0,
        expired: 0,
        hasCurrentQuery: false,
        isPrefetching: false
    });

    useEffect(() => {
        // Listen for prefetch events from custom events
        const handlePrefetchStart = () => {
            setCacheStats(prev => ({ ...prev, isPrefetching: true }));
        };

        const handlePrefetchEnd = () => {
            setCacheStats(prev => ({ ...prev, isPrefetching: false }));
        };

        window.addEventListener('prefetch-start', handlePrefetchStart);
        window.addEventListener('prefetch-end', handlePrefetchEnd);

        const updateStats = () => {
            const stats = searchCache.getStats();
            const hasCurrentQuery = query ? searchCache.has(query) : false;

            setCacheStats(prev => ({
                ...stats,
                hasCurrentQuery,
                isPrefetching: prev.isPrefetching
            }));
        };

        updateStats();
        const interval = setInterval(updateStats, 1000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('prefetch-start', handlePrefetchStart);
            window.removeEventListener('prefetch-end', handlePrefetchEnd);
        };
    }, [query]);

    if (cacheStats.total === 0) {
        return null; // Don't show if no cache data
    }

    return (
        <div className={`inline-flex items-center gap-2 bg-gray-800 rounded-lg border border-gray-600 px-3 py-2 text-sm ${className}`}>
            <div className="flex items-center gap-1">
                <Database className="w-4 h-4 text-indigo-400" />
                <span className="text-gray-300">Cache:</span>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-gray-300">
                    {cacheStats.valid} active
                </span>

                {cacheStats.hasCurrentQuery && (
                    <div className="flex items-center gap-1 text-green-400">
                        <Zap className="w-3 h-3" />
                        <span className="text-xs font-medium">Cached</span>
                    </div>
                )}

                {cacheStats.isPrefetching && (
                    <div className="flex items-center gap-1 text-indigo-400">
                        <Database className="w-3 h-3 animate-pulse" />
                        <span className="text-xs font-medium">Prefetching</span>
                    </div>
                )}

                {cacheStats.expired > 0 && (
                    <div className="flex items-center gap-1 text-orange-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{cacheStats.expired} expired</span>
                    </div>
                )}
            </div>

            <button
                onClick={() => {
                    searchCache.clear();
                    setCacheStats({ total: 0, valid: 0, expired: 0, hasCurrentQuery: false, isPrefetching: false });
                }}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                title="Clear cache"
            >
                Clear
            </button>
        </div>
    );
}
