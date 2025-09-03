'use client';

import { MapPin, Search, Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-900/90 border-t border-gray-700 mt-16 relative backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Simple footer with brand and credits */}
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    {/* Brand */}
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25">
                                <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                                <Search className="w-2 h-2 text-white" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Pathly
                            </h3>
                            <p className="text-xs text-gray-400">AI-Powered Local Search</p>
                        </div>
                    </div>

                    {/* Made with love */}
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <span>Made with</span>
                        <Heart className="w-4 h-4 text-red-400 fill-current" />
                        <span>for explorers</span>
                    </div>

                    {/* Copyright */}
                    <div className="text-sm text-gray-300">
                        © 2025 PlacesFinder. All rights reserved.
                    </div>
                </div>

                {/* Tech Credits - Compact */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="text-center">
                        <p className="text-xs text-gray-400 mb-2">Powered by</p>
                        <div className="flex flex-wrap justify-center items-center gap-2 text-xs text-gray-300">
                            <span className="bg-gray-800 px-2 py-1 rounded border border-gray-600">Foursquare API</span>
                            <span className="bg-gray-800 px-2 py-1 rounded border border-gray-600">Google Maps</span>
                            <span className="bg-gray-800 px-2 py-1 rounded border border-gray-600">AI Ranking</span>
                            <span className="bg-gray-800 px-2 py-1 rounded border border-gray-600">Next.js</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
