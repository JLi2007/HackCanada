"use client";
import React, { useState, useEffect } from "react";
import SwipeCard from "@/components/swipeCard";

interface Location {
  latitude: number;
  longitude: number;
}

export default function Swipe() {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [places, setPlaces] = useState<any>(null);
  const [displayCount, setDisplayCount] = useState(3);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationString = `${position.coords.latitude},${position.coords.longitude}`;
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          console.log("loading");

          try {
            const response = await fetch(
              `api/places?location=${locationString}`,
              {
                method: "GET",
                headers: {
                  Connection: "keep-alive",
                },
              }
            );

            console.log("done fetching places");

            const data = await response.json();
            console.log(data);

            if (response.ok) {
              setPlaces(data);
            } else {
              console.log("error in fetching response");
            }
          } catch (error) {
            console.log("Failed to fetch", error);
          }
        },
        (error) => {
          console.log("Error getting location", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, []);
  console.log(userLocation);

  const loadMorePlaces = () => {
    setDisplayCount(displayCount + 3); // Increment by 1 or change to another value for more places
  };

  return (
    <div className="relative overflow-hidden">
      <div className="h-screen w-screen bg-linear-to-b from-white via-stone-200 to-stone-400 font-manrope overflow-x-hidden">
          <h1 className="flex items-center p-5 text-5xl h-[10%] text-black font-extrabold text-center animate-gradient-x">
            Swipe
          </h1>

        <div>
          {places && (
            <div >
              <button
                onClick={loadMorePlaces}
                className="btn underline text-bold w-full"
              >
                Load More
              </button>
              <ul className="flex justify-between w-full">
                {places
                  .slice(displayCount - 3, displayCount)
                  .map((place: any, index: number) => (
                    <SwipeCard key={index} place={place} />
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
