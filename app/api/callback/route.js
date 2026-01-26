import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Check if user is logged in to your app
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Microsoft agar koi error bhejta hai
    if (error) {
      console.error("Microsoft Auth Error:", error);
      return NextResponse.redirect(new URL("/dashboard?error=auth_failed", req.url));
    }

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    // 2. Exchange Code for Tokens
    const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID,
        client_secret: process.env.AZURE_CLIENT_SECRET, // Ensure this is in .env
        code: code,
        redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error("Token Exchange Error:", tokens.error_description);
      throw new Error(tokens.error_description);
    }

    // 3. Get Microsoft Profile (Email/Name)
    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profileData = await profileRes.json();

    // 4. Save to MongoDB
    const client = await clientPromise;
    const db = client.db();

    const outlookAccountData = {
      userId: session.user.id, // Linked to your 'users' collection
      email: profileData.mail || profileData.userPrincipalName,
      displayName: profileData.displayName,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token, // Refresh token for future access
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
      updatedAt: new Date(),
    };

    // Use updateOne with upsert: true to avoid duplicates
    await db.collection("outlook_accounts").updateOne(
      { userId: session.user.id }, 
      { $set: outlookAccountData },
      { upsert: true }
    );

    // 5. Success! Redirect user
    return NextResponse.redirect(new URL("/dashboard?status=connected", req.url));

  } catch (err) {
    console.error("Callback Function Error:", err);
    return NextResponse.redirect(new URL("/dashboard?error=server_error", req.url));
  }
}