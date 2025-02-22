"use client";
import React, { useState } from "react";
import PlaceItem from "@/components/placeItem";

interface Location {
  latitude: number;
  longitude: number;
}

interface Place {
  id: string; // Ensure this is a unique identifier
  name: string;
  // Add other properties relevant to your place data
}

export default function Swipe() {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedPlaces, setLikedPlaces] = useState<Place[]>([]);
  const [dislikedPlaces, setDislikedPlaces] = useState<Place[]>([]);
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
          setLoading(true);

          try {
            const response = await fetch(`api/places?location=${locationString}`);
            const data = await response.json();
            if (response.ok) {
              setPlaces(data.results);
            } else {
              console.error("Error fetching places");
            }
          } catch (error) {
            console.error("Failed to fetch", error);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error getting location", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
    setLocationRequested(true);
  };

  const handleLike = (place: Place) => {
    setLikedPlaces((prev) => [...prev, place]);
    sendRecommendationData(place.id, true);
  };

  const handleDislike = (place: Place) => {
    setDislikedPlaces((prev) => [...prev, place]);
    sendRecommendationData(place.id, false);
  };

  const sendRecommendationData = async (placeId: string, liked: boolean) => {
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likedPlaces,
          dislikedPlaces,
          location: userLocation,
        }),
      });

      
    if (!response.ok) {
      const errorText = await response.text(); // Get error message from response
      throw new Error(`Failed to send recommendation data: ${errorText}`);
    }

      console.log('Recommendation data sent successfully');
    } catch (error) {
      console.error('Error sending recommendation data:', error);
    }
  };

  return (
    <div className="relative overflow-x-hidden">
      <div className="h-screen w-screen bg-linear-to-b from-stone-400 via-stone-200 to-white font-manrope overflow-x-hidden">
        <h1 className="flex items-center p-5 text-5xl h-[10%] text-black font-extrabold text-center animate-gradient-x">
          Swipe
        </h1>

        <div className="p-5">
          {!locationRequested && !loading && (
            <button onClick={getLocationData} className="btn">
              Get My Location
            </button>
          )}

          {userLocation && !loading ? (
            <p>
              Latitude: {userLocation.latitude}, Longitude: {userLocation.longitude}
            </p>
          ) : (
            <p>Loading location...</p>
          )}

          {places.length > 0 && (
            <div>
              <h3>Nearby Places:</h3>
              <ul>
                {places.map((place, index) => (
                  <li key={place.id || `place-${index}`} className="flex justify-between items-center">
                    <PlaceItem 
                      place={place} 
                      onLike={() => handleLike(place)} 
                      onDislike={() => handleDislike(place)} 
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
