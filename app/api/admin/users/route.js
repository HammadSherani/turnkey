import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const client = await clientPromise;
  const db = client.db();
  const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
  return NextResponse.json(users);
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId, isActive } = await req.json();
  const client = await clientPromise;
  const db = client.db();

  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { paymentStatus: isActive ? "active" : "deactive", updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}