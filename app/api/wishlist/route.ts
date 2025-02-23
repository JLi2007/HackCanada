import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getServerSession } from "next-auth";

const db = getFirestore();

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDoc = await db.collection("users").doc(session.user.email).get();
    const wishlist = userDoc.exists ? userDoc.data()?.wishlist || [] : [];
    return NextResponse.json({ wishlist });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}
