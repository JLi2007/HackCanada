"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading session...</p>;
  }

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      {session ? (
        <>
          <h1>Welcome, {session.user?.name}</h1>
          <p>You are signed in with {session.user?.email}</p>
          <button onClick={() => signOut()}>Sign Out</button>
        </>
      ) : (
        <>
          <h1>You are not signed in</h1>
          <button onClick={() => signIn("google")}>Sign In with Google</button>
        </>
      )}
    </div>
  );
}
