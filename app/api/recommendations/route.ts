import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

function weightedRandom(categories: Record<string, number>): string {
  const entries = Object.entries(categories);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const rand = Math.random() * total;
  let cumulative = 0;
  for (const [category, count] of entries) {
    cumulative += count;
    if (rand < cumulative) return category;
  }
  return entries[0][0]; // fallback
}

export async function POST(req: NextRequest) {
  try {
    // Extract likedPlaces (as full objects) and user's current location
    const { likedPlaces, location } = await req.json();
    const placesApiKey = process.env.GOOGLE_PLACES_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!placesApiKey || !geminiApiKey) {
      throw new Error("Missing API keys");
    }
    
    // If no liked places, return a message prompting the user to like some places
    if (!likedPlaces || likedPlaces.length === 0) {
      return NextResponse.json({
        recommendations: "No liked places found. Please like some places first."
      });
    }
    
    // Filter valid liked places and prepare an array with name and type info
    const validLikedPlaces = likedPlaces.filter((p: any) => p && p.id);
    const likedPlacesInfo = validLikedPlaces.map((p: any) => ({
      name: p.name || "Unknown Place",
      type: p.type || "Unknown Type"
    }));
    console.log("Formatted likedPlacesInfo:", likedPlacesInfo);
    
    // Initialize Gemini generative AI model
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Prompt Gemini to categorize the liked businesses
    const categorizationPrompt = `
      Given these liked businesses: ${JSON.stringify(likedPlacesInfo)},
      categorize each business into general business types (e.g., "Italian restaurant", "boba tea shop", "independent bookstore").
      Respond with a JSON object mapping each business name to its category.
    `;
    const categorizationResponse = await model.generateContent(categorizationPrompt);
    const rawResponse = categorizationResponse.response.text().trim();
    
    // Remove any code block formatting (if present)
    let jsonResponse = rawResponse;
    if (rawResponse.includes("```")) {
      jsonResponse = rawResponse.split("```")[1]
        .replace("json", "")
        .trim();
    }
    
    let categoryMap: Record<string, string>;
    try {
      categoryMap = JSON.parse(jsonResponse);
    } catch (error) {
      console.error("Failed to parse categories:", error);
      return NextResponse.json({
        recommendations: "Failed to process business categories."
      }, { status: 500 });
    }
    
    if (Object.keys(categoryMap).length === 0) {
      return NextResponse.json({
        recommendations: "No valid categories found from liked places."
      });
    }
    
    // Count frequencies of each category, excluding fast-food and chain labels
    const excludedCategories = [
      "Fast Food", "Chain Restaurant", "Big Franchise", "McDonald's", "Subway",
      "Starbucks", "Burger King", "KFC", "Domino's Pizza", "Dairy Queen",
      "Popeyes", "Taco Bell", "Little Caesars", "Wendy's", "Chick-fil-A",
      "Five Guys", "Dunkin'", "Jack in the Box", "Arby's", "Pizza Hut"
    ];
    const categoryCounts: Record<string, number> = {};
    for (const [_, category] of Object.entries(categoryMap)) {
      if (!excludedCategories.some(ex => category.toLowerCase().includes(ex.toLowerCase()))) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    }
    
    if (Object.keys(categoryCounts).length === 0) {
      return NextResponse.json({
        recommendations: "No valid categories found from liked places."
      });
    }
    
    // Select a category – 60% weighted by the liked data and 40% random from Gemini
    let selectedCategory: string;
    if (Math.random() < 0.6) {
      const restaurantBias = Object.keys(categoryCounts).filter(cat =>
        cat.toLowerCase().includes("restaurant")
      );
      if (restaurantBias.length > 0) {
        const nonRestaurantCategories = Object.entries(categoryCounts)
          .filter(([cat]) => !restaurantBias.includes(cat));
        selectedCategory = weightedRandom(Object.fromEntries(nonRestaurantCategories));
      } else {
        selectedCategory = weightedRandom(categoryCounts);
      }
      console.log("Selected category (user preferences):", selectedCategory);
    } else {
      const randomPrompt = `
        Suggest a random type of local business or service (e.g., "bakery", "indie bookstore", "sushi restaurant", "art gallery").
        Only respond with the category name.
      `;
      const randomResponse = await model.generateContent(randomPrompt);
      selectedCategory = randomResponse.response.text().trim();
      console.log("Selected category (random):", selectedCategory);
    }
    
    // Use the selected category to search for recommendations via Google Places Text Search API
    let recommendations: string[] = [];
    let radius = 5000; // start with 5km
    const maxRadius = 20000; // max 20km
    let pagetoken: string | null = null;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (recommendations.length < 5 && attempts < maxAttempts) {
      let placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        selectedCategory
      )}&location=${location.latitude},${location.longitude}&radius=${radius}&key=${placesApiKey}`;
      if (pagetoken) {
        placesUrl += `&pagetoken=${pagetoken}`;
      }
      
      const placesRes = await fetch(placesUrl);
      const placesData = await placesRes.json();
      
      if (!placesData.results || placesData.results.length === 0) {
        if (radius < maxRadius) {
          radius += 5000;
          console.log(`Increasing radius to ${radius} meters`);
        } else {
          break;
        }
      } else {
        // Filter out common chain names
        const excludedChains = [
          "McDonald's", "Burger King", "Subway", "KFC", "Wendy's", "Taco Bell", "Starbucks",
          "Domino's Pizza", "Pizza Hut", "Dairy Queen", "Popeyes", "Chick-fil-A", "Five Guys",
          "Arby's", "Dunkin'", "Jack in the Box", "Little Caesars"
        ];
        const filteredPlaces = placesData.results.filter((p: any) =>
          !excludedChains.some(chain => p.name.toLowerCase().includes(chain.toLowerCase()))
        );
        
        if (filteredPlaces.length > 0) {
          // Create a simplified list for Gemini to choose from
          const placeOptions = filteredPlaces.map((p: any) => ({
            name: p.name,
            address: p.formatted_address,
            rating: p.rating || "No rating"
          }));
          
          const selectionPrompt = `
            Given the following places that match the category "${selectedCategory}", pick the best one for the user based on their preferences:
            ${JSON.stringify(placeOptions)}.
            Return only the best place's name and address.
          `;
          const selectionResponse = await model.generateContent(selectionPrompt);
          const recommendation = selectionResponse.response.text().trim();
          recommendations.push(recommendation);
        }
        
        if (placesData.next_page_token) {
          pagetoken = placesData.next_page_token;
        } else {
          pagetoken = null;
          if (radius < maxRadius) {
            radius += 5000;
            console.log(`Increasing radius to ${radius} meters`);
          } else {
            break;
          }
        }
      }
      attempts++;
    }
    
    if (recommendations.length === 0) {
      return NextResponse.json({
        recommendations: `No places found for ${selectedCategory} within the search area.`
      });
    }
    
    console.log("Final recommendations:", recommendations);
    return NextResponse.json({ recommendations });
    
  } catch (error) {
    console.error("Error in recommendation handler:", error);
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}
