'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ChatInterface from '@/components/ChatInterface';
import ResultsSection from '@/components/ResultsSection';
import Footer from '@/components/Footer';
import { prefetchCommonSearches } from '@/utils/prefetch';

export interface Location {
  latitude: number;
  longitude: number;
  timezone: string;
  captured_at: string;
  accuracy_m?: number;
}

export interface Place {
  rank: number;
  place_id: string;
  google_place_id?: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number | null;
  address: string | null;
  tel: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  review_summary: string;
  location_summary: string;
}

export interface SearchResults {
  query_analysis: {
    interpreted_intent: string;
    context_used: string;
    needs_inferred: string[];
    not_wanted_inferred: string[];
    ranking_approach: string;
  };
  ranked_places: Place[];
}

export default function HomePage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // // Prefetch common searches when location is available and user is idle
  // useEffect(() => {
  //   if (location && !isLoading) {
  //     // Use requestIdleCallback for non-critical operations
  //     const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));

  //     const idleId = idleCallback(() => {
  //       prefetchCommonSearches(location);
  //     });

  //     return () => {
  //       if (window.cancelIdleCallback) {
  //         window.cancelIdleCallback(idleId);
  //       } else {
  //         clearTimeout(idleId);
  //       }
  //     };
  //   }
  // }, [location, isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex flex-col">
      <Header />

      <main className="flex-1">
        {!searchResults ? (
          <HeroSection
            location={location}
            setLocation={setLocation}
            onSearchResults={setSearchResults}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            error={error}
            setError={setError}
          />
        ) : (
          <>
            <ChatInterface
              location={location}
              onSearchResults={setSearchResults}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              setError={setError}
            />
            <ResultsSection
              results={searchResults}
              location={location}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
