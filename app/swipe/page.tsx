"use client";
import React, { useState } from "react";
import PlaceItem from "@/components/placeItem";

interface Location {
  latitude: number;
  longitude: number;
}

export default function Swipe() {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [places, setPlaces] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(1); 
  const [locationRequested, setLocationRequested] = useState(false);

  const getLocationData = () => {   
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationString = `${position.coords.latitude},${position.coords.longitude}`;
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          console.log('loading');
          setLoading(true);

          try {
            const response = await fetch(
              `api/places?location=${locationString}`, {
                method: "GET",
                headers: {
                  Connection: "keep-alive",
                },
              }
            );

            console.log("done fetching places")

            const data = await response.json();
            console.log(data);

            if (response.ok) {
              setPlaces(data.results);
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
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
    setLocationRequested(true);
  };

  const loadMorePlaces = () => {
    setDisplayCount(displayCount + 1); // Increment by 1 or change to another value for more places
  };

  return (
    <div className="relative overflow-x-hidden">
      <div className="h-screen w-screen bg-linear-to-b from-stone-400 via-stone-200 to-white font-manrope overflow-x-hidden">
        <h1 className="flex items-center p-5 text-5xl h-[10%] text-black font-extrabold text-center animate-gradient-x">
          Swipe
        </h1>

        <div className="p-5">
            {!locationRequested && !loading && (
            <button
              onClick={getLocationData}
              className="btn"
            >
              Get My Location
            </button>
          )}

          {userLocation && !loading ? (
            <p>
              Latitude: {userLocation?.latitude}, Longitude:{" "}
              {userLocation?.longitude}
            </p>
          ) : (
            <p>Loading location...</p>
          )}

          {places && (
            <div>
              <h3>Nearby Places:</h3>
              <ul>
                {places.slice(0, displayCount).map((place: any, index: number) => (
                  <PlaceItem key={index} place={place} />
                ))}
              </ul>
              <button onClick={loadMorePlaces} className="btn">
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
