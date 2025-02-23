import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getServerSession } from "next-auth";

const db = getFirestore();

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Expecting a full "place" object (with metadata) and an "action" string.
    const { place, action } = await request.json();
    if (!place?.id || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userRef = db.collection("users").doc(session.user.email);
    const locationsRef = db.collection("locations");

    // Look up an existing document for this place in the locations collection.
    const locationSnapshot = await locationsRef
      .where("id", "==", place.id)
      .limit(1)
      .get();
    const locationRef = locationSnapshot.empty
      ? locationsRef.doc() // Create new doc if none exists
      : locationSnapshot.docs[0].ref;

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const locationDoc = await transaction.get(locationRef);
      // Wishlist is now an array of objects.
      const wishlist = userDoc.exists ? userDoc.data()?.wishlist || [] : [];

      // Check if this place is already liked by looking for an object with a matching id.
      const alreadyLiked = wishlist.some((p: any) => p.id === place.id);

      if (action === "like" && !alreadyLiked) {
        transaction.set(
          userRef,
          { wishlist: [...wishlist, place] },
          { merge: true }
        );

        transaction.set(
          locationRef,
          {
            id: place.id,
            name: place.name,
            total_likes:
              (locationDoc.exists ? locationDoc.data()?.total_likes || 0 : 0) + 1,
            // You can store additional metadata if needed.
          },
          { merge: true }
        );
      } else if (action === "unlike" && alreadyLiked) {
        transaction.set(
          userRef,
          {
            wishlist: wishlist.filter((p: any) => p.id !== place.id),
          },
          { merge: true }
        );

        const currentLikes = locationDoc.exists
          ? locationDoc.data()?.total_likes || 0
          : 0;
        transaction.set(
          locationRef,
          {
            total_likes: Math.max(0, currentLikes - 1),
          },
          { merge: true }
        );
      }
    });

    const locationDoc = await locationRef.get();
    return NextResponse.json({
      success: true,
      totalLikes: locationDoc.exists ? locationDoc.data()?.total_likes || 0 : 0,
    });
  } catch (error) {
    console.error("Error processing like/unlike:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("placeId");
    const session = await getServerSession();

    if (!placeId) {
      return NextResponse.json({ error: "Place ID is required" }, { status: 400 });
    }

    // Query by the "id" field (not document ID) in locations.
    const locationSnapshot = await db
      .collection("locations")
      .where("id", "==", placeId)
      .limit(1)
      .get();

    let isLiked = false;
    if (session?.user?.email) {
      const userDoc = await db.collection("users").doc(session.user.email).get();
      const wishlist = userDoc.exists ? userDoc.data()?.wishlist || [] : [];
      isLiked = wishlist.some((p: any) => p.id === placeId);
    }

    const locationDoc = locationSnapshot.empty
      ? null
      : locationSnapshot.docs[0];
    return NextResponse.json({
      totalLikes: locationDoc?.data()?.total_likes || 0,
      isLiked,
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 });
  }
}
