// app/api/places/route.ts
import { NextResponse } from "next/server";

// Add excluded chains constant
const EXCLUDED_CHAINS = [
  "McDonald's",
  "Burger King",
  "Subway",
  "KFC",
  "Wendy's",
  "Taco Bell",
  "Starbucks",
  "Domino's Pizza",
  "Pizza Hut",
  "Dairy Queen",
  "Popeyes",
  "Chick-fil-A",
  "Five Guys",
  "Arby's",
  "Dunkin'",
  "Jack in the Box",
  "Little Caesars",
  "Tim Hortons",
];

// Add chain and franchise identifiers
const CHAIN_INDICATORS = [
  // Major chains
  ...EXCLUDED_CHAINS,
  // Common franchise terms
  "franchise",
  "chain",
  "corp",
  "corporation",
  "inc",
  "incorporated",
  // Common chain location patterns
  "# location",
  "# branch",
  "store #",
  // Common chain suffixes
  "llc",
  "ltd",
  "co.",
  "company",
  // International chains
  "international",
  "worldwide",
  "global",
];

// Keywords that suggest local/family business
const LOCAL_BUSINESS_INDICATORS = [
  "family owned",
  "family run",
  "family business",
  "local",
  "independent",
  "authentic",
  "homemade",
  "handmade",
  "artisan",
  "traditional",
  "original",
  "since",
  "brothers",
  "sisters",
  "& sons",
  "& daughters",
  "house of",
  "casa",
  "ristorante",
  "trattoria",
  "bistro",
  "cafe",
  "deli",
  "market",
];

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

function isLikelyLocalBusiness(place: any): boolean {
  const name = place.name.toLowerCase();
  const vicinity = (place.vicinity || "").toLowerCase();

  // Check for chain indicators
  const hasChainIndicators = CHAIN_INDICATORS.some((indicator) =>
    name.includes(indicator.toLowerCase())
  );
  if (hasChainIndicators) return false;

  // Positive indicators for local business
  const hasLocalIndicators = LOCAL_BUSINESS_INDICATORS.some(
    (indicator) =>
      name.includes(indicator.toLowerCase()) ||
      vicinity.includes(indicator.toLowerCase())
  );

  // Additional heuristics
  const isSmallBusiness = place.user_ratings_total < 1000; // Fewer reviews often indicate local business
  const hasPersonName = /^[A-Z][a-z]+('s|\s+&|$)/.test(place.name); // Names like "Joe's", "Mary & John's"

  return hasLocalIndicators || isSmallBusiness || hasPersonName;
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

    // Enhanced filtering for local businesses
    const filteredResults = data.results.filter((place: any) =>
      isLikelyLocalBusiness(place)
    );

    const places = await Promise.all(
      filteredResults.map(async (place: any) => {
        return {
          name: place.name,
          address: place.vicinity || "Address not available",
          photo: place.photos?.[0]?.photo_reference
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
            : null,
          id: place.place_id,
          description: await getPlaceDetails(place.place_id, apiKey!),
          type: type,
          rating: place.rating || null,
          user_ratings_total: place.user_ratings_total || 0,
          price_level: place.price_level || null,
        };
      })
    );

    // Sort by rating and number of reviews
    const sortedPlaces = places.sort((a, b) => {
      if (a.rating === b.rating) {
        return (b.user_ratings_total || 0) - (a.user_ratings_total || 0);
      }
      return (b.rating || 0) - (a.rating || 0);
    });

    console.log(NextResponse.json(sortedPlaces));
    return NextResponse.json(sortedPlaces);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}
