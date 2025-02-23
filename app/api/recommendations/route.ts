import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getFirestore } from "firebase-admin/firestore";

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

export async function POST(req: NextRequest) {
  try {
    const { likedPlaces, location } = await req.json();
    const placesApiKey = process.env.GOOGLE_PLACES_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const db = getFirestore();

    if (!placesApiKey || !geminiApiKey) {
      throw new Error("API keys are not set");
    }

    // Add console logs to debug wishlist data
    console.log("Received likedPlaces:", likedPlaces);

    // If likedPlaces is empty or undefined, return early with a message
    if (!likedPlaces || likedPlaces.length === 0) {
      return NextResponse.json({
        recommendations: "No liked places found. Please like some places first."
      });
    }

    // Fetch full location details from Firestore
    const locationsRef = db.collection("locations");
    const locationDetails = await Promise.all(
      likedPlaces.map(async (placeId: string) => {
        console.log("Fetching details for placeId:", placeId);
        const locationSnapshot = await locationsRef
          .where("id", "==", placeId)
          .limit(1)
          .get();

        if (!locationSnapshot.empty) {
          const data = locationSnapshot.docs[0].data();
          console.log("Found location data:", data);
          return data;
        }
        console.log("No location found for placeId:", placeId);
        return null;
      })
    );

    // Filter out any null values
    const validLocations = locationDetails.filter(loc => loc !== null);
    console.log("Valid locations:", validLocations);

    // Format locations for the prompt
    const likedPlacesInfo = validLocations.map(place => ({
      name: place.name || "Unknown Place",
      type: place.type || place.category || "Unknown Type"
    }));
    console.log("Formatted likedPlacesInfo:", likedPlacesInfo);

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Update the categorization prompt to use the formatted data
    const categorizationPrompt = `
      Given these liked businesses: ${JSON.stringify(likedPlacesInfo)},
      categorize each business into general business types (e.g., "Italian restaurant", "boba tea shop", "independent bookstore").
      Respond with a JSON object mapping each business name to its category.
    `;

    const categorizationResponse = await model.generateContent(categorizationPrompt);
    const rawResponse = categorizationResponse.response.text().trim();

    // Extract just the JSON object, handling both with and without code blocks
    let jsonResponse = rawResponse;
    if (rawResponse.includes('```')) {
      jsonResponse = rawResponse.split('```')[1]   // Get content between backticks
        .replace('json', '')                     // Remove 'json' language identifier
        .trim();                                 // Clean up whitespace
    }

    try {
      const categoryMap: Record<string, string> = JSON.parse(jsonResponse);

      // If empty object, return early
      if (Object.keys(categoryMap).length === 0) {
        return NextResponse.json({
          recommendations: "No valid categories found from liked places."
        });
      }

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
        // Favor non-restaurant categories if present
        const restaurantBias = Object.keys(categoryCounts).filter(cat => cat.toLowerCase().includes("restaurant"));
        if (restaurantBias.length > 0) {
          // If there are restaurants, pick from all but those
          const nonRestaurantCategories = Object.entries(categoryCounts).filter(([cat]) => !restaurantBias.includes(cat));
          selectedCategory = weightedRandom(Object.fromEntries(nonRestaurantCategories));
        } else {
          selectedCategory = weightedRandom(categoryCounts);
        }
        console.log("Chosen category (from user preferences):", selectedCategory);
      } else {
        const randomPrompt = `
            Suggest a random type of local business or service (e.g., "bakery", "indie bookstore", "sushi restaurant", "art gallery").
            Only respond with the category name.
          `;
        const randomResponse = await model.generateContent(randomPrompt);
        selectedCategory = randomResponse.response.text().trim();
        console.log("Chosen category (random Gemini choice):", selectedCategory);
      }

      let recommendations = [];
      let radius = 5000; // Start with a 5km radius
      let maxRadius = 20000; // Maximum radius to search (20km)
      let pagetoken = null;
      let attempts = 0;
      const maxAttempts = 5; // Limit the number of API calls

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
            radius += 5000; // Increase radius by 5km
            console.log(`Increasing radius to ${radius} meters`);
          } else {
            break; // No more places found even with expanded radius
          }
        } else {
          const excludedChains = [
            "McDonald's", "Burger King", "Subway", "KFC", "Wendy's", "Taco Bell", "Starbucks",
            "Domino's Pizza", "Pizza Hut", "Dairy Queen", "Popeyes", "Chick-fil-A", "Five Guys",
            "Arby's", "Dunkin'", "Jack in the Box", "Little Caesars"
          ];

          const filteredPlaces = placesData.results.filter((p: any) =>
            !excludedChains.some(chain => p.name.toLowerCase().includes(chain.toLowerCase()))
          );

          if (filteredPlaces.length > 0) {
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
        return NextResponse.json({ recommendations: `No places found for ${selectedCategory} within the search area.` });
      }

      console.log("Final recommendations:", recommendations);
      return NextResponse.json({ recommendations: recommendations });

    } catch (error) {
      console.error("Failed to parse categories:", error);
      return NextResponse.json({
        recommendations: "Failed to process business categories."
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}