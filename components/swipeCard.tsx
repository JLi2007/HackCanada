/* eslint-disable @next/next/no-img-element */

"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
    <Card className="relative max-w-lg shadow-none m-5 max-h-screen">
      <CardHeader>
        <img
          src={place.photo}
          alt={place.name || "Image of Location"}
          className=" w-[90vw] h-[55vh]"
        />
      </CardHeader>
      <CardContent>
        <CardTitle className="text-2xl">{place.name}</CardTitle>
        <CardDescription>{place.address}</CardDescription>
        <CardDescription>{place.description}</CardDescription>
      </CardContent>
      <CardFooter className="space-x-4">
        <Button>Let&apos;s go</Button>
        <Button variant="secondary">Another time</Button>
      </CardFooter>
    </Card>
  );
});

SwipeCard.displayName = "SwipeCard";

export default SwipeCard;
