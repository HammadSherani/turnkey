import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; 
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const params = new URLSearchParams({
    client_id: process.env.AZURE_AD_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
    response_mode: "query",
    scope: "offline_access Mail.Read User.Read",
    state: session.user.id, 
    prompt: "select_account",
  });

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
