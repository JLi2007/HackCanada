import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Function to pick a category based on weighted probability
function weightedRandom(categories: Record<string, number>): string {
  const entries = Object.entries(categories);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const rand = Math.random() * total;

  let cumulative = 0;
  for (const [category, count] of entries) {
    cumulative += count;
    if (rand < cumulative) return category;
  }
  return entries[0][0]; // Fallback in case of edge cases
}

// Function to get a random element from an array
// function getRandomElement<T>(array: T[]): T {
//   return array[Math.floor(Math.random() * array.length)];
// }

export async function POST(req: NextRequest) {
  try {
    const { likedPlaces, location } = await req.json();

    const placesApiKey = process.env.GOOGLE_PLACES_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!placesApiKey || !geminiApiKey) {
      throw new Error("API keys are not set");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Step 1: Use Gemini to determine business categories from liked places
    const categorizationPrompt = `
    Given these liked businesses: ${JSON.stringify(likedPlaces.map((p: any) => p.name))},
    categorize each business into general business types (e.g., "Italian restaurant", "boba tea shop", "independent bookstore").
    Respond with a JSON object mapping each business name to its category.
    `;

    const categorizationResponse = await model.generateContent(categorizationPrompt);
    console.log(categorizationResponse.response.text());

    const rawResponse = categorizationResponse.response.text().trim();
    const jsonResponse = rawResponse.replace(/^```json\n/, "").replace(/\n```$/, "");

    // Parse the cleaned JSON response
    const categoryMap: Record<string, string> = JSON.parse(jsonResponse);

    // Step 2: Count occurrences of each category, excluding fast food
    const excludedCategories = [
      "Fast Food", "Chain Restaurant", "Big Franchise", "McDonald's", "Subway",
      "Starbucks", "Burger King", "KFC", "Domino's Pizza", "Dairy Queen",
      "Popeyes", "Taco Bell", "Little Caesars", "Wendy's", "Chick-fil-A",
      "Five Guys", "Dunkin'", "Jack in the Box", "Arby's", "Pizza Hut"
    ];

    const categoryCounts: Record<string, number> = {};
    for (const [category] of Object.entries(categoryMap)) { //[business,category] but removed business
      if (!excludedCategories.some(excluded => category.toLowerCase().includes(excluded.toLowerCase()))) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    }

    if (Object.keys(categoryCounts).length === 0) {
      return NextResponse.json({ recommendations: "No valid categories found from liked places." });
    }

    // Step 3: Choose a category (60% weighted, 40% random)
    let selectedCategory: string;
    if (Math.random() < 0.6) {
      selectedCategory = weightedRandom(categoryCounts);
      console.log("Chosen category (from user preferences):", selectedCategory);
    } else {
      const randomPrompt = `
      Suggest a random type of local business or restaurant (e.g., "bakery", "indie bookstore", "sushi restaurant").
      Only respond with the category name.
      `;

      const randomResponse = await model.generateContent(randomPrompt);
      selectedCategory = randomResponse.response.text().trim();
      console.log("Chosen category (random Gemini choice):", selectedCategory);
    }

    // Step 4: Use Google Places API to find places of the selected type
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      selectedCategory
    )}&location=${location.latitude},${location.longitude}&radius=5000&key=${placesApiKey}`;

    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();

    if (!placesData.results || placesData.results.length === 0) {
      return NextResponse.json({ recommendations: "No places found for: " + selectedCategory });
    }

    // Exclude fast food chains from Google Places API results
    const excludedChains = [
      "McDonald's", "Burger King", "Subway", "KFC", "Wendy's", "Taco Bell", "Starbucks",
      "Domino's Pizza", "Pizza Hut", "Dairy Queen", "Popeyes", "Chick-fil-A", "Five Guys",
      "Arby's", "Dunkin'", "Jack in the Box", "Little Caesars"
    ];

    const filteredPlaces = placesData.results.filter((p: any) =>
      !excludedChains.some(chain => p.name.toLowerCase().includes(chain.toLowerCase()))
    );

    if (filteredPlaces.length === 0) {
      return NextResponse.json({ recommendations: "No local businesses found matching your preferences." });
    }

    // Step 5: Let Gemini pick the best place
    const placeOptions = filteredPlaces.map((p: any) => ({
      name: p.name,
      address: p.formatted_address,
      rating: p.rating || "No rating",
    }));

    const selectionPrompt = `
    Given the following places that match the category "${selectedCategory}", pick the best one for the user based on their preferences:
    ${JSON.stringify(placeOptions)}.
    Return only the best place's name and address.
    `;

    const selectionResponse = await model.generateContent(selectionPrompt);
    const recommendation = selectionResponse.response.text().trim();

    console.log("Final recommendation:", recommendation);
    return NextResponse.json({ recommendations: recommendation });

  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
