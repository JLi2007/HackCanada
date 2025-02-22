import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { FirestoreAdapter } from "@next-auth/firebase-adapter";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Parse the service account JSON from the environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      privateKey: serviceAccount.privateKey,
    }),
  });
}

const db = getFirestore();
const adminAuth = getAuth();

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  adapter: FirestoreAdapter(db),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if the user exists in Firebase Auth
      try {
        await adminAuth.getUserByEmail(user.email);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          try {
            await adminAuth.createUser({
              email: user.email,
              displayName: user.name,
            });
            console.log("Created new Firebase Auth user for:", user.email);
          } catch (createError) {
            console.error("Error creating Firebase Auth user:", createError);
            return false;
          }
        } else {
          console.error("Error retrieving Firebase Auth user:", error);
          return false;
        }
      }
      return true;
    },
  },
});

export { handler as GET, handler as POST };
