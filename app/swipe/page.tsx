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
  const [loading, setLoading] = useState(false);
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
          setLoading(true);

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
          } finally {
            setLoading(false);
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

  const loadMorePlaces = () => {
    setDisplayCount(displayCount + 3); // Increment by 1 or change to another value for more places
  };

  return (
    <div className="relative overflow-hidden">
      <div className="h-screen w-screen bg-linear-to-b from-stone-400 via-stone-200 to-white font-manrope overflow-x-hidden">
        <div className="flex flex-row items-end">
          <h1 className="flex items-center p-5 text-5xl h-[10%] text-black font-extrabold text-center animate-gradient-x">
            Swipe
          </h1>
          {userLocation && !loading ? (
            <p className="w-full flex justify-end mx-10">
              Latitude: {userLocation?.latitude}, Longitude:{" "}
              {userLocation?.longitude}
            </p>
          ) : (
            <p>Loading location...</p>
          )}
        </div>

        <div>
          {places && (
            <div >
              <button
                onClick={loadMorePlaces}
                className="btn underline text-bold"
              >
                Load More
              </button>
              <ul className="flex justify-between w-full border-r">
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
