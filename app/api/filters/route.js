import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const filters = await db.collection("filters")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ filters });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, name, ...data } = await req.json();

    const client = await clientPromise;
    const db = client.db();

    if (id) {
      // UPDATE EXISTING FILTER
      await db.collection("filters").updateOne(
        { _id: new ObjectId(id), userId: session.user.id },
        { 
          $set: { 
            name: name || "Sans nom", // Name maintain karein
            data: data, 
            updatedAt: new Date() 
          } 
        }
      );
      return NextResponse.json({ id, message: "Filtre mis à jour" });
    } else {
      // CREATE NEW FILTER
      const newFilter = {
        userId: session.user.id,
        name: name || "Nouveau Filtre",
        data,
        createdAt: new Date(),
      };
      const result = await db.collection("filters").insertOne(newFilter);
      return NextResponse.json({ id: result.insertedId, name: newFilter.name });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}