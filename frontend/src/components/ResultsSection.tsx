'use client';

import React, { useState, useMemo } from 'react';
import { MapPin, Star, Phone, ExternalLink, Navigation, Clock, Filter, Grid, List, Map } from 'lucide-react';
import { SearchResults, Place, Location } from '@/app/page';
import StaticMap from './StaticMap';

interface ResultsSectionProps {
    results: SearchResults;
    location: Location | null;
}

export default function ResultsSection({ results, location }: ResultsSectionProps) {
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'map'>('list');
    const [sortBy, setSortBy] = useState<'rank' | 'distance' | 'rating'>('rank');
    const [filterOpen, setFilterOpen] = useState(false);

    // Sort places based on selected criteria - memoized to prevent unnecessary re-renders
    const sortedPlaces = useMemo(() => {
        return [...results.ranked_places].sort((a, b) => {
            switch (sortBy) {
                case 'distance':
                    return (a.distance || Infinity) - (b.distance || Infinity);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                default:
                    return a.rank - b.rank;
            }
        });
    }, [results.ranked_places, sortBy]);

    const formatDistance = (distance: number | null) => {
        if (!distance) return 'Distance unknown';
        if (distance < 1) return `${Math.round(distance * 1000)}m`;
        return `${distance.toFixed(1)}km`;
    };

    // Define PlaceCard component 
    const PlaceCard = ({ place, index }: { place: Place; index: number }) => {
        // Only render Photo Gallery once the component is in viewport using dynamic import
        return (
            <div className="bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-700 shadow-purple-500/10 hover:shadow-purple-500/20">
                {/* Header */}
                <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold px-2 py-1 rounded-lg">
                                    #{place.rank}
                                </span>
                                {place.distance && (
                                    <span className="text-sm text-gray-300 bg-gray-700/50 px-2 py-1 rounded-lg">
                                        {formatDistance(place.distance)}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{place.name}</h3>
                            {place.address && (
                                <p className="text-gray-300 flex items-center space-x-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{place.address}</span>
                                </p>
                            )}
                        </div>

                        {/* Rating */}
                        {place.rating && (
                            <div className="flex items-center space-x-1 bg-yellow-500/20 px-3 py-2 rounded-lg border border-yellow-500/30">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="font-semibold text-yellow-300">{place.rating}</span>
                                {place.review_count && (
                                    <span className="text-sm text-gray-400">({place.review_count})</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {place.tel && (
                            <a
                                href={`tel:${place.tel}`}
                                className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                            >
                                <Phone className="w-4 h-4" />
                                <span>{place.tel}</span>
                            </a>
                        )}
                        {place.website && (
                            <a
                                href={place.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>Website</span>
                            </a>
                        )}
                    </div>

                    {/* Directions Button */}
                    {place.latitude && place.longitude && location && (
                        <div className="mb-4">
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${place.latitude},${place.longitude}&travelmode=driving`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors w-full sm:w-auto justify-center"
                            >
                                <Navigation className="w-4 h-4" />
                                <span>Get Directions</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}

                    {/* Photo Gallery - disabled */}
                    {/* Photo functionality has been removed */}

                    {/* Location Summary */}
                    <div className="bg-gray-700/50 rounded-lg p-4 mb-4 border border-gray-600">
                        <h4 className="font-semibold text-white mb-2">Why this place?</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{place.location_summary}</p>
                    </div>

                    {/* Review Summary */}
                    {place.review_summary && place.review_summary !== 'No review data available.' && (
                        <div className="bg-indigo-900/30 rounded-lg p-4 border border-indigo-700/50">
                            <h4 className="font-semibold text-white mb-2">What people say</h4>
                            <p className="text-gray-300 text-sm leading-relaxed">{place.review_summary}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Memoize PlaceCard rendering for each place
    const MemoizedPlaceCard = useMemo(() =>
        React.memo(PlaceCard, (prevProps, nextProps) => {
            // Only re-render if the place data changed
            return prevProps.place.place_id === nextProps.place.place_id &&
                prevProps.index === nextProps.index;
        }),
        []);

    return (
        <section className="py-8 px-4 sm:px-6 lg:px-8 mb-16">
            <div className="max-w-7xl mx-auto">
                {/* Results Header */}
                <div className="mb-8">
                    <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 shadow-purple-500/10">
                        <div className="mb-4">
                            <h2 className="text-2xl font-bold text-white mb-2">Search Results</h2>
                            <p className="text-gray-300">{results.query_analysis.interpreted_intent}</p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                            <div className="flex flex-wrap items-center space-x-4">
                                <span className="text-sm text-gray-300">
                                    Found {results.ranked_places.length} places
                                </span>
                            </div>

                            <div className="flex items-center space-x-4">
                                {/* Sort */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'rank' | 'distance' | 'rating')}
                                    className="text-sm bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="rank">Best Match</option>
                                    <option value="distance">Nearest First</option>
                                    <option value="rating">Highest Rated</option>
                                </select>

                                {/* View Mode */}
                                <div className="flex bg-gray-700 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-600 shadow-sm' : ''}`}
                                        title="List View"
                                    >
                                        <List className="w-4 h-4 text-gray-300" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-600 shadow-sm' : ''}`}
                                        title="Grid View"
                                    >
                                        <Grid className="w-4 h-4 text-gray-300" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('map')}
                                        className={`p-2 rounded ${viewMode === 'map' ? 'bg-gray-600 shadow-sm' : ''}`}
                                        title="Map View"
                                    >
                                        <Map className="w-4 h-4 text-gray-300" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Content */}
                {viewMode === 'map' ? (
                    /* Map View */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px] lg:h-[700px]">
                        {/* Results List - Scrollable */}
                        <div className="space-y-4 overflow-y-auto max-h-full pr-2">
                            {sortedPlaces.map((place, index) => (
                                <MemoizedPlaceCard key={`map-card-${place.place_id}-${index}`} place={place} index={index} />
                            ))}
                        </div>

                        {/* Map */}
                        <div className="h-full">
                            {location && (
                                <StaticMap
                                    userLocation={location}
                                    places={sortedPlaces}
                                    className="h-full"
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    /* Grid/List View */
                    <div className={`grid gap-6 ${viewMode === 'grid'
                        ? 'grid-cols-1 lg:grid-cols-2'
                        : 'grid-cols-1'
                        }`}>
                        {sortedPlaces.map((place, index) => (
                            <MemoizedPlaceCard key={`list-card-${place.place_id}-${index}`} place={place} index={index} />
                        ))}
                    </div>
                )}

                {/* No Results */}
                {results.ranked_places.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700 shadow-purple-500/10">
                            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No places found</h3>
                            <p className="text-gray-300">Try adjusting your search query or location.</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
