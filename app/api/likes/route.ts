// app/api/likes/route.ts
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

    const { placeId, action } = await request.json();
    if (!placeId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userRef = db.collection("users").doc(session.user.email);
    const locationsRef = db.collection("locations");

    // First check if location exists with this ID
    const locationSnapshot = await locationsRef
      .where("id", "==", placeId)
      .limit(1)
      .get();
    const locationRef = locationSnapshot.empty
      ? locationsRef.doc() // Create new doc with auto-ID if location doesn't exist
      : locationSnapshot.docs[0].ref;

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const locationDoc = await transaction.get(locationRef);
      const wishlist = userDoc.exists ? userDoc.data()?.wishlist || [] : [];

      if (action === "like" && !wishlist.includes(placeId)) {
        transaction.set(
          userRef,
          { wishlist: [...wishlist, placeId] },
          { merge: true }
        );

        transaction.set(
          locationRef,
          {
            id: placeId, // Store the original ID
            total_likes:
              (locationDoc.exists ? locationDoc.data()?.total_likes || 0 : 0) +
              1,
          },
          { merge: true }
        );
      } else if (action === "unlike" && wishlist.includes(placeId)) {
        transaction.set(
          userRef,
          {
            wishlist: wishlist.filter((id: string | number) => id !== placeId),
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

    // Get updated counts
    const locationDoc = await locationRef.get();
    return NextResponse.json({
      success: true,
      totalLikes: locationDoc.exists ? locationDoc.data()?.total_likes || 0 : 0,
    });
  } catch (error) {
    console.error("Error processing like/unlike:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("placeId");
    const session = await getServerSession();

    if (!placeId) {
      return NextResponse.json(
        { error: "Place ID is required" },
        { status: 400 }
      );
    }

    // Query by ID field instead of document ID
    const locationSnapshot = await db
      .collection("locations")
      .where("id", "==", placeId)
      .limit(1)
      .get();

    let isLiked = false;
    if (session?.user?.email) {
      const userDoc = await db
        .collection("users")
        .doc(session.user.email)
        .get();
      const wishlist = userDoc.exists ? userDoc.data()?.wishlist || [] : [];
      isLiked = wishlist.includes(placeId);
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
    return NextResponse.json(
      { error: "Failed to fetch likes" },
      { status: 500 }
    );
  }
}
