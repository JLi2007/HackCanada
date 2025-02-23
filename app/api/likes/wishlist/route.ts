import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getServerSession } from "next-auth";

const db = getFirestore();

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's wishlist directly from the users collection
        const userDoc = await db.collection("users").doc(session.user.email).get();
        const wishlist = userDoc.exists ? userDoc.data()?.wishlist || [] : [];

        // Get the corresponding location details for each wishlist item
        const locationsRef = db.collection("locations");
        const locationDetails = await Promise.all(
            wishlist.map(async (placeId: string) => {
                const locationSnapshot = await locationsRef
                    .where("id", "==", placeId)
                    .limit(1)
                    .get();

                if (!locationSnapshot.empty) {
                    return {
                        id: placeId,
                        ...locationSnapshot.docs[0].data()
                    };
                }
                return null;
            })
        );

        // Filter out any null values and return the wishlist
        const validLocations = locationDetails.filter(location => location !== null);
        return NextResponse.json({ wishlist: validLocations });

    } catch (error) {
        console.error("Error fetching wishlist:", error);
        return NextResponse.json(
            { error: "Failed to fetch wishlist" },
            { status: 500 }
        );
    }
} 