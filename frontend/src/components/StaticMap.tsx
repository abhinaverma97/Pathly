'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Navigation, Map as MapIcon, ExternalLink } from 'lucide-react';
import type { Location, Place } from '@/app/page';

interface StaticMapProps {
    userLocation: Location;
    places: Place[];
    className?: string;
}

export default function StaticMap({ userLocation, places, className = '' }: StaticMapProps) {
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

    // Get Google Maps API key from environment variables with validation
    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    // Warn if API key is missing (for development)
    if (!GOOGLE_MAPS_API_KEY && process.env.NODE_ENV === 'development') {
        console.warn('Google Maps API key is missing. Maps may not work properly.');
    }

    // Generate Google Maps embed with your location and selected destination - memoized
    const generateMapWithDirections = useCallback(() => {
        if (selectedPlace) {
            // Show directions from your location to the selected place
            const origin = `${userLocation.latitude},${userLocation.longitude}`;
            const destination = `${selectedPlace.latitude},${selectedPlace.longitude}`;
            return `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${origin}&destination=${destination}&mode=driving`;
        } else {
            // Show your location with nearby restaurants
            const center = `${userLocation.latitude},${userLocation.longitude}`;
            // Create markers for your location and all places
            return `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=${center}&zoom=13`;
        }
    }, [userLocation.latitude, userLocation.longitude, selectedPlace, GOOGLE_MAPS_API_KEY]);

    // Alternative: Use simple Google Maps without API key but with multiple markers - memoized
    const mapUrl = useMemo(() => {
        if (selectedPlace) {
            // Show directions to selected place
            const origin = `${userLocation.latitude},${userLocation.longitude}`;
            const destination = `${selectedPlace.latitude},${selectedPlace.longitude}`;
            return `https://www.google.com/maps?saddr=${origin}&daddr=${destination}&output=embed`;
        } else {
            // Show your location with search overlay
            const center = `${userLocation.latitude},${userLocation.longitude}`;
            const query = encodeURIComponent('restaurants');
            return `https://www.google.com/maps?q=${query}&ll=${center}&z=13&output=embed`;
        }
    }, [userLocation.latitude, userLocation.longitude, selectedPlace]);

    // Generate directions URL for a specific place - memoized
    const getDirectionsUrl = useCallback((place: Place) => {
        return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${place.latitude},${place.longitude}&travelmode=driving`;
    }, [userLocation.latitude, userLocation.longitude]);

    return (
        <div className={`relative rounded-lg overflow-hidden border border-gray-200 bg-white ${className}`}>
            {/* Google Maps Section - Top */}
            <div className="relative bg-gray-100">
                {/* Map Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <MapIcon className="w-5 h-5 text-blue-600" />
                            🗺️ Interactive Map
                        </h4>
                        <div className="flex items-center gap-3">
                            {selectedPlace && (
                                <>
                                    <span className="text-sm text-blue-600 font-medium">
                                        📍 {selectedPlace.name}
                                    </span>
                                    <button
                                        onClick={() => setSelectedPlace(null)}
                                        className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded transition-colors"
                                    >
                                        Clear
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Google Maps Embed */}
                <div className="relative">
                    <iframe
                        src={mapUrl}
                        className="w-full border-0"
                        style={{ height: '400px' }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={selectedPlace ? `Directions to ${selectedPlace.name}` : "Your Location & Nearby Restaurants"}
                        key={selectedPlace?.place_id || 'general-map'} // Force reload when selection changes
                    />

                    {/* Map Instructions */}
                    <div className="absolute bottom-4 left-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
                        <div className="text-center">
                            {selectedPlace ? (
                                <>
                                    <p className="text-sm text-gray-700 mb-1">
                                        🧭 <strong>Directions to {selectedPlace.name}</strong>
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        Route from your location • Click another place below to change destination
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-700 mb-1">
                                        📍 <strong>Your Location & Restaurants</strong>
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        Click a place below to see directions • Zoom and pan to explore
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Places & Directions Section - Bottom */}
            <div className="bg-white border-t border-gray-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Navigation className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold text-gray-900">Places & Directions</h3>
                        </div>
                        <span className="text-sm text-gray-600">{places.length} places found</span>
                    </div>
                </div>

                {/* Your Location */}
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">📍</span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-blue-900">Your Location</h4>
                            <p className="text-sm text-blue-700">
                                {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Places List */}
                <div className="overflow-y-auto max-h-96">
                    {places.map((place, index) => (
                        <div
                            key={`google-map-place-${place.place_id}-${index}`}
                            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${selectedPlace?.place_id === place.place_id ? 'bg-blue-50 border-blue-200' : ''
                                }`}
                            onClick={() => setSelectedPlace(place)}
                        >
                            <div className="flex items-start gap-3">
                                {/* Number Badge */}
                                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    {index + 1}
                                </div>

                                {/* Place Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 truncate">{place.name}</h4>
                                    <p className="text-sm text-gray-600 mb-2">{place.address}</p>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3 text-xs mb-3">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                                            #{place.rank}
                                        </span>
                                        {place.distance && (
                                            <span className="text-gray-600">{place.distance.toFixed(1)} km</span>
                                        )}
                                        {place.rating && (
                                            <span className="text-yellow-600">⭐ {place.rating}</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedPlace(place);
                                            }}
                                            className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
                                        >
                                            <MapIcon size={12} />
                                            Show on Map
                                        </button>

                                        <a
                                            href={getDirectionsUrl(place)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Navigation size={12} />
                                            Directions
                                        </a>

                                        {place.website && (
                                            <a
                                                href={place.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ExternalLink size={12} />
                                                Website
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}