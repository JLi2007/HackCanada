// app/api/places/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location"); // e.g., "latitude,longitude"
    const radius = searchParams.get("radius") || "1000"; // default radius in meters
    const type = searchParams.get("type") || "local%20restaurant"; // default type

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

        console.log(NextResponse.json(data));
        return NextResponse.json(data);
    } catch (error) {
        console.log(error);

        return NextResponse.json(
            { error: "Failed to fetch places" },
            { status: 500 }
        );
    }
}
