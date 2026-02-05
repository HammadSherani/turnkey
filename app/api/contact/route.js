import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const messages = await db.collection("contacts")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, message } = body;

    const client = await clientPromise;
    const db = client.db();

    await db.collection("contacts").insertOne({
      firstName,
      lastName,
      email,
      message,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, message: "Envoyé avec succès" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}