import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import axios from "axios";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); 
    const error = searchParams.get("error");

    if (error) {
      console.error("Microsoft Auth Error:", error);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?outlook=error`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?outlook=invalid`);
    }

    const tokenRes = await axios.post(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID, 
        client_secret: process.env.AZURE_AD_CLIENT_SECRET,
        code,
        redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    const profileRes = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const outlookUser = profileRes.data;
    const userEmail = outlookUser.mail || outlookUser.userPrincipalName;

    const client = await clientPromise;
    const db = client.db();

    await db.collection("outlook_accounts").updateOne(
      { userId: state }, 
      {
        $set: {
          userId: state,
          provider: "outlook",
          email: userEmail,
          displayName: outlookUser.displayName,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000),
          connected: true, 
          connectedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?outlook=connected`);

  } catch (err) {
    console.error("[Outlook Callback Error]:", err.response?.data || err.message);

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?outlook=failed`);
  }
}