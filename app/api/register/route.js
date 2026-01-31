import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, email, password, planName } = await req.json();

    const client = await clientPromise;
    const db = client.db();

    // 1. Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "Cet utilisateur existe déjà" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. New User Object
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: "user",
      plan: planName || "STARTER", 
      paymentStatus: "pending",  
      extractionsUsed: 0,        
      createdAt: new Date(),
      updatedAt: new Date(),
      limits: getPlanLimits(planName) 
    };

    const result = await db.collection("users").insertOne(newUser);

    return NextResponse.json({ 
      message: "User registered successfully",
      userId: result.insertedId, 
      planSelected: planName 
    }, { status: 201 });

  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

function getPlanLimits(plan) {
  const p = plan?.toUpperCase();
  switch (p) {
    case "STARTER": return { extractions: 1500, filters: 3, fields: 3 };
    case "PRO": return { extractions: 7500, filters: 5, fields: 5 };
    case "PRIME": return { extractions: 25000, filters: 10, fields: 10 };
    default: return { extractions: 1500, filters: 3, fields: 3 };
  }
}