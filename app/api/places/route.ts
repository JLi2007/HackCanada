// app/api/places/route.ts
import { NextResponse } from "next/server";

async function getPlaceDetails(placeId: string, apiKey: string) {
    console.log("placeI", placeId, "apiKye", apiKey);
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=editorial_summary&key=${apiKey}`;

    const response = await fetch(detailsUrl);
    const detailsData = await response.json();
    console.log("Place Details API Response:", detailsData);

    return (
        detailsData.result?.editorial_summary?.overview ||
        "No description available"
    );
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location"); // e.g., "latitude,longitude"
    const radius = searchParams.get("radius") || "1000"; // default radius in meters
    const type = searchParams.get("type") || "restaurant"; // default type

    if (!location) {
        return NextResponse.json(
            { error: "Location is required" },
            { status: 400 }
        );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY; // Use your environment variable
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error_message) {
            return NextResponse.json({ error: data.error_message }, { status: 400 });
        }

        const places = await Promise.all(
            data.results.map(async (place: any) => {
                return {
                    name: place.name,
                    address: place.vicinity || "Address not available",
                    photo: place.photos?.[0]?.photo_reference
                        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
                        : null,
                    id: place.place_id,
                    description: await getPlaceDetails(place.place_id, apiKey!), // Ensure description is included
                    type: type,
                };
            })
        );

        console.log(NextResponse.json(places));
        return NextResponse.json(places);
    } catch (error) {
        console.log(error);

        return NextResponse.json(
            { error: "Failed to fetch places" },
            { status: 500 }
        );
    }
}
