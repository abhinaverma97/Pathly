'use client';

import { useState } from 'react';
import { MapPin, Search, Loader2, AlertCircle, Star, TrendingUp, Globe } from 'lucide-react';
import { Location, SearchResults } from '@/app/page';
import CitySelector, { FAMOUS_CITIES, City } from './CitySelector';

interface HeroSectionProps {
    location: Location | null;
    setLocation: (location: Location | null) => void;
    onSearchResults: (results: SearchResults) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
}

// Famous cities are now imported from CitySelector component

export default function HeroSection({
    location,
    setLocation,
    onSearchResults,
    isLoading,
    setIsLoading,
    error,
    setError
}: HeroSectionProps) {
    const [query, setQuery] = useState('');
    const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
    const [showCitySelector, setShowCitySelector] = useState(false);

    const requestLocation = async () => {
        setLocationStatus('requesting');
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by this browser');
            setLocationStatus('error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation: Location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    captured_at: new Date().toISOString(),
                    accuracy_m: position.coords.accuracy
                };
                setLocation(newLocation);
                setLocationStatus('success');
            },
            (error) => {
                setError(`Location error: ${error.message}`);
                setLocationStatus('error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    };

    const selectCity = (city: typeof FAMOUS_CITIES[0]) => {
        const newLocation: Location = {
            latitude: city.latitude,
            longitude: city.longitude,
            timezone: city.timezone,
            captured_at: new Date().toISOString()
        };
        setLocation(newLocation);
        setLocationStatus('success');
        setShowCitySelector(false);
        setError(null);
    };

    const handleSearch = async () => {
        if (!query.trim()) {
            setError('Please enter a search query');
            return;
        }

        if (!location) {
            setError('Please allow location access first');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query.trim(),
                    location
                }),
                // Set 2 minute timeout for search requests
                signal: AbortSignal.timeout(120000) // 120 seconds = 2 minutes
            });

            const data = await response.json();

            if (data.success) {
                onSearchResults(data.data.ranked_results);
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

    return (
        <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-violet-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto text-center">
                {/* Hero Text */}
                <div className="mb-12">
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
                        Find Amazing{' '}
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Places
                        </span>{' '}
                        Near You
                    </h1>
                    <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                        Discover the best restaurants, cafes, shops, and attractions with our AI-powered search.
                        Get personalized recommendations based on your location and preferences.
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap justify-center items-center gap-6 mb-12">
                        <div className="flex items-center space-x-2 text-gray-300">
                            <Star className="w-5 h-5 text-yellow-400" />
                            <span className="font-medium">AI-Ranked Results</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-300">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            <span className="font-medium">Real-time Data</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-300">
                            <MapPin className="w-5 h-5 text-indigo-400" />
                            <span className="font-medium">Location-aware</span>
                        </div>
                    </div>
                </div>

                {/* Location Request */}
                {!location && (
                    <div className="mb-8">
                        <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700 shadow-purple-500/10">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/25">
                                    <MapPin className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Allow Location Access</h3>
                                <p className="text-gray-300 text-center max-w-md">
                                    We need your location to find the best places near you. Your location data is only used for search and never stored.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                                    <button
                                        onClick={requestLocation}
                                        disabled={locationStatus === 'requesting'}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                    >
                                        {locationStatus === 'requesting' ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Getting Location...</span>
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="w-5 h-5" />
                                                <span>Share My Location</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowCitySelector(!showCitySelector)}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-teal-700 transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 flex items-center justify-center space-x-2"
                                    >
                                        <Globe className="w-5 h-5" />
                                        <span>Choose City</span>
                                    </button>
                                </div>

                                {/* City Selector */}
                                {showCitySelector && (
                                    <div className="w-full max-w-2xl mt-6">
                                        <CitySelector
                                            onSelectCity={selectCity}
                                            onCancel={() => setShowCitySelector(false)}
                                            className="bg-gray-900/50 border-gray-600"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Interface */}
                {location && (
                    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700 shadow-purple-500/10">
                        <div className="mb-4">
                            <div className="flex items-center justify-center space-x-2 text-green-400 mb-2">
                                <MapPin className="w-5 h-5" />
                                <span className="text-sm font-medium">Location set</span>
                            </div>
                            <div className="text-xs text-gray-400 text-center">
                                {location.accuracy_m ?
                                    `Current location (±${Math.round(location.accuracy_m)}m accuracy)` :
                                    `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                                }
                            </div>
                            <button
                                onClick={() => setShowCitySelector(true)}
                                className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline transition-colors"
                            >
                                Change to a different city
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Search for coffee shops, restaurants, attractions..."
                                    className="w-full pl-12 pr-4 py-4 text-lg bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white placeholder-gray-400"
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isLoading || !query.trim()}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 min-w-[140px]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Searching...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        <span>Search</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Quick Search Suggestions */}
                        <div className="mt-6">
                            <p className="text-gray-400 text-sm mb-3">Popular searches:</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {['Coffee shops', 'Restaurants', 'Gas stations', 'ATMs', 'Pharmacies', 'Gyms'].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setQuery(suggestion)}
                                        className="px-4 py-2 text-sm bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600 rounded-lg transition-colors"
                                        disabled={isLoading}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* City Selector Overlay */}
                {showCitySelector && location && (
                    <div className="mt-6">
                        <CitySelector
                            onSelectCity={selectCity}
                            onCancel={() => setShowCitySelector(false)}
                        />
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mt-6 max-w-2xl mx-auto">
                        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-xl flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
        </section>
    );
}
