"use client";
import React, { useState, useEffect, useCallback } from "react";
import SwipeCard from "@/components/swipeCard";

interface Location {
  latitude: number;
  longitude: number;
}

interface Place {
  id: string | number;
  name: string;
  address?: string;
  description?: string;
  photo?: string;
  type?: string;
}

export default function Swipe() {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [displayCount, setDisplayCount] = useState(3);
  const [likedPlaces, setLikedPlaces] = useState<Record<string | number, boolean>>({});

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationString = `${position.coords.latitude},${position.coords.longitude}`;
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          try {
            const response = await fetch(`api/places?location=${locationString}`);
            const data: Place[] = await response.json();

            if (response.ok) {
              setPlaces(data);
              setLikedPlaces({}); 
            } else {
              console.error("Error in fetching response");
            }
          } catch (error) {
            console.error("Failed to fetch", error);
          }
        },
        (error) => console.error("Error getting location", error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  const loadMorePlaces = useCallback(() => {
    setDisplayCount((prev) => prev + 3);
    setLikedPlaces({}); // Reset likes when new places are displayed
  }, []);

  // 🔹 Add event listener for keyboard presses
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter") { // Spacebar or Enter key
        event.preventDefault(); // Prevent default scrolling behavior
        loadMorePlaces();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [loadMorePlaces]);

  return (
    <div className="relative overflow-hidden">
      <div className="h-screen w-screen bg-gradient-to-b from-white via-stone-200 to-stone-400 font-manrope overflow-x-hidden">
        <h1 className="flex items-center p-5 text-5xl h-[10%] text-black font-extrabold text-center animate-gradient-x">
          Swipe
        </h1>

        <div>
          {places && (
            <div>
              <button
                onClick={loadMorePlaces}
                className="btn underline font-bold w-full"
              >
                Load More (Press Space / Enter)
              </button>
              <ul className="flex justify-between w-full">
                {places
                  .slice(displayCount - 3, displayCount)
                  .map((place: Place) => (
                    <SwipeCard
                      key={place.id}
                      place={place}
                      likedPlaces={likedPlaces}
                      setLikedPlaces={setLikedPlaces}
                    />
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
