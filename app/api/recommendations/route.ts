import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming request body
    const { likedPlaces, dislikedPlaces, location } = await req.json();

  
    // Generate the prompt based on user preferences
    const prompt = `User has liked these places: ${JSON.stringify(
      likedPlaces.map((p: any) => p.name)
    )}. 
    User has disliked these places: ${JSON.stringify(
      dislikedPlaces.map((p: any) => p.name)
    )}.
    Based on these preferences, suggest 5 new places near (${location.latitude}, ${location.longitude}).`;

    // Make the API request to get recommendations
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateText",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          key: process.env.GEMINI_API_KEY,
        }),
      }
    );

    // Check if the response is successful
    if (!res.ok) {
      const errorData = await res.json();
      console.error("API Error:", errorData);
      return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 });
    }

    // Parse the API response
    const result = await res.json();
    console.log("API Response:", result);

    // Return the recommendations
    return NextResponse.json({ recommendations: result.candidates[0].output });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}
