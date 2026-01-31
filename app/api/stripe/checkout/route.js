import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.redirect(new URL("/auth", req.url));

    const client = await clientPromise;
    const db = client.db();

    // User ka current plan aur status reset karein
    // Note: Asli production mein ye kaam Webhook se hona chahiye (Step 3)
    // Lekin simple setup ke liye hum yahan update kar rahe hain
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { 
        $set: { 
          paymentStatus: "active",
          extractionsUsed: 0 // Naye plan par usage reset
        } 
      }
    );

    // Dashboard par wapis bhej dein
    return NextResponse.redirect(new URL("/dashboard?payment=success", req.url));
  } catch (error) {
    return NextResponse.redirect(new URL("/dashboard?payment=error", req.url));
  }
}