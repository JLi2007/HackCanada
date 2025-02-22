/* eslint-disable @next/next/no-img-element */

"use client";
import React from "react";
// import { Button } from "@/components/ui/button";
import {
  Card,
  // CardContent,
  CardDescription,
  // CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlaceItemProps {
  place: any;
  address?: string;
  description?: string;
  photo?: string;
}

const SwipeCard: React.FC<PlaceItemProps> = React.memo(({ place }) => {
  return (
    <Card className="relative w-full max-h-screen shadow-none m-1">
      <CardHeader className="w-full h-[85vh] overflow-hidden">
        <img
          src={place.photo}
          alt={place.name || "Image of Location"}
          className="w-auto h-full object-cover rounded-lg"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-4 justify-end">
          <CardTitle className="text-3xl font-bold bg-stone-400/50 w-full p-1">{place.name}</CardTitle>
          <CardDescription className="text-white text-lg bg-stone-400/50 w-full p-1">{place.address}</CardDescription>
          <CardDescription className="text-white bg-stone-400/50 w-full p-1">{place.description}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
});

SwipeCard.displayName = "SwipeCard";

export default SwipeCard;
