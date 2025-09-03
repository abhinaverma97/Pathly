'use client';

import { MapPin } from 'lucide-react';
import { Location } from '@/app/page';

interface CitySelectorProps {
    onSelectCity: (city: City) => void;
    onCancel: () => void;
    className?: string;
}

export interface City {
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
}

// Famous cities with coordinates
export const FAMOUS_CITIES: City[] = [
    { name: 'New York, NY', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
    { name: 'Los Angeles, CA', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
    { name: 'London, UK', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
    { name: 'Paris, France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
    { name: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
    { name: 'Sydney, Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
    { name: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles' },
    { name: 'Miami, FL', latitude: 25.7617, longitude: -80.1918, timezone: 'America/New_York' },
    { name: 'Barcelona, Spain', latitude: 41.3851, longitude: 2.1734, timezone: 'Europe/Madrid' },
    { name: 'Dubai, UAE', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' }
];

export default function CitySelector({ onSelectCity, onCancel, className = '' }: CitySelectorProps) {
    return (
        <div className={`bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-600 ${className}`}>
            <h4 className="text-lg font-semibold text-white mb-4 text-center">Select a City</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {FAMOUS_CITIES.map((city) => (
                    <button
                        key={city.name}
                        onClick={() => onSelectCity(city)}
                        className="p-3 text-left bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 hover:border-indigo-500 rounded-lg transition-all shadow-sm hover:shadow-md"
                    >
                        <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-indigo-400" />
                            <span className="font-medium text-white">{city.name}</span>
                        </div>
                    </button>
                ))}
            </div>
            <button
                onClick={onCancel}
                className="mt-4 w-full py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
                Cancel
            </button>
        </div>
    );
}
