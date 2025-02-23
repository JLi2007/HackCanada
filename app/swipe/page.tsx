"use client";
import React, { useState, useEffect, useCallback } from "react";
import SwipeCard from "@/components/swipeCard";
import { FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

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
  const [likedPlaces, setLikedPlaces] = useState<
    Record<string | number, boolean>
  >({});
  const [showFilter, adjustShowFilter] = useState(false);

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
            const response = await fetch(
              `api/places?location=${locationString}`
            );
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

  console.log(userLocation);
  const togglePanel = () => {
    adjustShowFilter((prev) => !prev);
  };

  const loadMorePlaces = useCallback(() => {
    setDisplayCount((prev) => prev + 3);
    setLikedPlaces({}); // Reset likes when new places are displayed
  }, []);

  // 🔹 Add event listener for keyboard presses
  useEffect(() => {
    if(!showFilter){
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === " " || event.key === "Enter") {
          // Spacebar or Enter key
          event.preventDefault(); // Prevent default scrolling behavior
          loadMorePlaces();
        }
      };
  
      document.addEventListener("keydown", handleKeyPress);
      return () => document.removeEventListener("keydown", handleKeyPress);
    }
  }, [loadMorePlaces, showFilter]);

  return (
    <div className="relative overflow-hidden">
      <div className="h-screen w-screen bg-gradient-to-b from-white via-stone-200 to-stone-400 font-manrope overflow-x-hidden">
        <div>
          {places && (
            <div>
              {showFilter && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                  <div className="bg-stone-400/80 shadow-lg p-6 rounded-lg w-100 h-auto">
                    <h1 className="text-black">Filters</h1>
                    <Textarea placeholder="What local businesses do you want to see?" />
                    <div className="mt-5 h-auto">
                      <h4 className="flex items-center justify-center">radius(km)</h4>
                      <div className="flex">
                        <h4 className="flex justify-start w-full">1km</h4>
                        <h4 className="flex justify-end w-full">20km</h4>
                      </div>
                      <Slider defaultValue={[100]} max={20000} step={10} className={"h-10"} />
                    </div>
                    <button
                      onClick={() => adjustShowFilter(false)}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded w-full"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}
              <div className="w-full flex items-center justify-center">
                <Button
                  className="text-black bg-transparent hover:bg-stone-100/80 shadow-black/80 shadow-sm m-2"
                  onClick={togglePanel}
                >
                  <FilterIcon />
                </Button>

                <button
                  onClick={loadMorePlaces}
                  className="btn underline font-bold w-full"
                >
                  Load More (Press Space / Enter)
                </button>
              </div>
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
