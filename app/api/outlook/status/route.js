import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // 1. Session Check (Zaroori hai ke user login ho)
    if (!session?.user?.id) {
      return NextResponse.json(
        { connected: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 2. Outlook account dhoondein
    const outlookAccount = await db
      .collection("outlook_accounts")
      .findOne({ userId: session.user.id });

    // 3. Logic: Agar record nahi hai YA connected false hai YA tokens gayab hain
    // Humne Logout mein tokens ko $unset kiya tha, isliye accessToken ka check lazmi hai
    if (!outlookAccount || outlookAccount.connected === false || !outlookAccount.accessToken) {
      return NextResponse.json({
        connected: false,
        message: "Outlook account is not connected",
      });
    }

    // 4. Success: Account valid aur connected hai
    return NextResponse.json({
      connected: true,
      data: {
        email: outlookAccount.email,
        displayName: outlookAccount.displayName || "Outlook User",
        connectedAt: outlookAccount.connectedAt || outlookAccount.updatedAt,
        // Frontend ko batane ke liye ke token kab expire hoga (optional)
        expiresAt: outlookAccount.expiresAt || null,
      }
    });

  } catch (error) {
    console.error("Status API Error:", error);
    return NextResponse.json(
      { connected: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}