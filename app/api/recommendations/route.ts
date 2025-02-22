import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    // Ensure the GEMINI_API_KEY is defined
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    // Create a Gemini client instance with your API key
    const genAI = new GoogleGenerativeAI(apiKey);

    // Get the generative model instance; here we're using "gemini-1.5-flash"
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content using the prompt
    const result = await model.generateContent(prompt);
    console.log("Result: ", result.response.text());
    // Return the recommendations (assuming the result contains the generated text in response.text())
    return NextResponse.json({ recommendations: result.response.text() });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
