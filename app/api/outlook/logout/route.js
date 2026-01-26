import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("outlook_accounts").updateOne(
      { userId: session.user.id },
      { 
        $set: { 
          connected: false,
          updatedAt: new Date() 
        },
        $unset: { 
          accessToken: "", 
          refreshToken: "", 
          expiresAt: "" 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "No account found to disconnect" }, { status: 404 });
    }

    return NextResponse.json({ message: "Outlook disconnected successfully" });

  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}