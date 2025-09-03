'use client';

import { useState } from 'react';
import { Search, Loader2, Send, ArrowLeft } from 'lucide-react';
import { Location, SearchResults } from '@/app/page';
import { getCachedSearchResults } from '@/utils/prefetch';

interface ChatInterfaceProps {
    location: Location | null;
    onSearchResults: (results: SearchResults) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export default function ChatInterface({
    location,
    onSearchResults,
    isLoading,
    setIsLoading,
    setError
}: ChatInterfaceProps) {
    const [query, setQuery] = useState('');

    const handleSearch = async () => {
        if (!query.trim() || !location) return;

        setIsLoading(true);
        setError(null);

        // Normalize the query (lowercase, trim)
        const normalizedQuery = query.trim().toLowerCase();

        try {
            // Check if we have cached results
            const cachedResults = getCachedSearchResults(normalizedQuery, location);

            if (cachedResults) {
                console.log('Using cached search results');
                onSearchResults(cachedResults.data.ranked_results);
                setQuery(''); // Clear the input after successful search
                setIsLoading(false);
                return;
            }

            // No cache hit, proceed with API request
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: normalizedQuery,
                    location
                }),
                // Set 2 minute timeout for search requests
                signal: AbortSignal.timeout(120000) // 120 seconds = 2 minutes
            });

            const data = await response.json();

            if (data.success) {
                onSearchResults(data.data.ranked_results);
                setQuery(''); // Clear the input after successful search
            } else {
                setError(data.error || 'Search failed');
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'TimeoutError') {
                setError('Search timed out. This is normal on first run - please try again.');
            } else {
                setError('Network error. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            handleSearch();
        }
    };

    const handleNewSearch = () => {
        window.location.reload(); // Simple way to start over
    };

    return (
        <div className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700 sticky top-16 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center space-x-4">
                    {/* Back to start button */}
                    <button
                        onClick={handleNewSearch}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">New Search</span>
                    </button>

                    {/* Search bar */}
                    <div className="flex-1 max-w-2xl">
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Search for more places..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white placeholder-gray-400"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isLoading || !query.trim()}
                                className="absolute right-2 p-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Filter section removed - was non-functional */}
                </div>

                {/* Quick suggestions */}
                <div className="mt-3 flex flex-wrap gap-2">
                    {['Coffee near me', 'Best restaurants', 'Gas stations', 'Pharmacies', 'ATMs'].map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => setQuery(suggestion)}
                            className="px-3 py-1 text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600 rounded-lg transition-colors"
                            disabled={isLoading}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
