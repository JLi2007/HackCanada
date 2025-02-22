// app/api/gemini/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { preferences, restaurants } = await request.json();

  if (!preferences || !restaurants || !Array.isArray(restaurants)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateText?key=${apiKey}`;

  const prompt = `Based on the following preferences: "${preferences}", rank these restaurants in order of best fit:\n\n${restaurants.join(", ")}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 150, // Adjust based on response length needed
      }),
    });

    const data = await response.json();
    return NextResponse.json({ recommendation: data.choices[0]?.text || "No response" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}