import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.redirect(new URL("/auth?mode=login", req.url));
    }

    return NextResponse.redirect(new URL("/dashboard?payment=success", req.url));

  } catch (error) {
    console.error("Redirect Error:", error);
    return NextResponse.redirect(new URL("/dashboard?payment=error", req.url));
  }
}