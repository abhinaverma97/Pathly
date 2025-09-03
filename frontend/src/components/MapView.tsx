'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Navigation, ExternalLink } from 'lucide-react';
import type { Location, Place } from '@/app/page';

interface MapViewProps {
    userLocation: Location;
    places: Place[];
    className?: string;
}

// Custom marker icons
const userIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
});

const placeIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#EF4444" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="10" r="3" fill="white"/>
    </svg>
  `),
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
});

// Component to fit map bounds
function MapBounds({ userLocation, places }: { userLocation: Location; places: Place[] }) {
    const map = useMap();

    useEffect(() => {
        if (!map || places.length === 0) return;

        try {
            const bounds = [
                [userLocation.latitude, userLocation.longitude],
                ...places.map(place => [place.latitude, place.longitude])
            ] as [number, number][];

            map.fitBounds(bounds, { padding: [20, 20] });
        } catch (error) {
            console.warn('Failed to fit map bounds:', error);
        }
    }, [map, userLocation, places]);

    return null;
}

// Generate directions URL
function getDirectionsUrl(from: Location, to: Place): string {
    const params = new URLSearchParams({
        api: '1',
        origin: `${from.latitude},${from.longitude}`,
        destination: `${to.latitude},${to.longitude}`,
        travelmode: 'driving'
    });

    return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function MapView({ userLocation, places, className = '' }: MapViewProps) {
    const mapRef = useRef<any>(null);

    // Calculate center point
    const center: [number, number] = [userLocation.latitude, userLocation.longitude];

    // Ensure places have valid coordinates
    const validPlaces = places.filter(place =>
        place.latitude && place.longitude &&
        !isNaN(place.latitude) && !isNaN(place.longitude)
    );

    return (
        <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${className}`}>
            <MapContainer
                ref={mapRef}
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
                key={`map-${userLocation.latitude}-${userLocation.longitude}`}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User location marker */}
                <Marker
                    position={[userLocation.latitude, userLocation.longitude]}
                    icon={userIcon}
                >
                    <Popup>
                        <div className="text-center">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="font-semibold">Your Location</span>
                            </div>
                            <p className="text-sm text-gray-600">
                                {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                            </p>
                        </div>
                    </Popup>
                </Marker>

                {/* Place markers */}
                {validPlaces.map((place) => (
                    <Marker
                        key={`marker-${place.place_id}`}
                        position={[place.latitude, place.longitude]}
                        icon={placeIcon}
                    >
                        <Popup maxWidth={280}>
                            <div className="space-y-3">
                                {/* Header */}
                                <div>
                                    <h3 className="font-semibold text-lg leading-tight">{place.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{place.address}</p>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-4">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                            #{place.rank}
                                        </span>
                                        {place.distance && (
                                            <span className="text-gray-600">
                                                {place.distance.toFixed(1)} km
                                            </span>
                                        )}
                                    </div>
                                    {place.rating && (
                                        <span className="text-yellow-600 font-medium">
                                            ⭐ {place.rating}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2 border-t">
                                    <a
                                        href={getDirectionsUrl(userLocation, place)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <Navigation size={14} />
                                        Directions
                                    </a>

                                    {place.website && (
                                        <a
                                            href={place.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded flex items-center justify-center transition-colors"
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Auto-fit bounds */}
                <MapBounds
                    userLocation={userLocation}
                    places={validPlaces}
                    key={`bounds-${validPlaces.length}`}
                />
            </MapContainer>
        </div>
    );
}
