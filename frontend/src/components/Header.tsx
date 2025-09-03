'use client';

import { MapPin, Search } from 'lucide-react';

export default function Header() {
    return (
        <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                                <Search className="w-2.5 h-2.5 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Pathly
                            </h1>
                            <p className="text-xs text-gray-400">AI-Powered Local Search</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <a
                            href="#features"
                            onClick={(e) => {
                                e.preventDefault();
                                window.scrollTo({
                                    top: document.getElementById('features')?.offsetTop || 0,
                                    behavior: 'smooth'
                                });
                            }}
                            className="text-gray-300 hover:text-indigo-400 transition-colors font-medium"
                        >
                            Features
                        </a>
                        <a
                            href="https://github.com/your-repo/places-finder"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-300 hover:text-indigo-400 transition-colors font-medium"
                        >
                            GitHub
                        </a>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                alert('Demo version - Contact feature coming soon!');
                            }}
                            className="text-gray-300 hover:text-indigo-400 transition-colors font-medium"
                        >
                            Contact
                        </a>
                    </nav>

                    {/* CTA Button */}
                    <div className="flex items-center space-x-4">
                        <span className="hidden sm:block px-4 py-2 text-xs font-medium text-indigo-300 bg-indigo-950/50 border border-indigo-800 rounded-lg">
                            Demo Version
                        </span>
                        <button
                            onClick={() => {
                                window.scrollTo({
                                    top: 0,
                                    behavior: 'smooth'
                                });
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                        >
                            Search Places
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
