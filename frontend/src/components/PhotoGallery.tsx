'use client';

import { Camera } from 'lucide-react';

interface PhotoGalleryProps {
    placeId: string;
    placeName: string;
    googlePlaceId?: string;
    className?: string;
}

export default function PhotoGallery({ placeId, placeName, googlePlaceId, className = '' }: PhotoGalleryProps) {
    // Photo functionality has been removed
    return (
        <div className={`${className}`}>
            <div className="flex items-center gap-2 text-gray-500 bg-gray-100 py-2 px-4 rounded-lg">
                <Camera className="w-4 h-4" />
                <span className="text-sm">Photos have been disabled</span>
            </div>
        </div>
    );
}
