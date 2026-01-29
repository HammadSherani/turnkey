import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, email, password, planName } = await req.json();

    console.log(name, email, planName);
    
    
    const client = await clientPromise;
    const db = client.db();

    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: "user",
      plan: planName || "FREE", 
      paymentStatus: "pending",  
      createdAt: new Date(),
      limits: getPlanLimits(planName) 
    };

    await db.collection("users").insertOne(newUser);

    // 3. Frontend ko success response bhejain
    return NextResponse.json({ 
      message: "User registered successfully",
      planSelected: planName 
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Helper function to set limits based on package
function getPlanLimits(plan) {
  switch (plan) {
    case "STARTER": return { extractions: 1500, filters: 2, fields: 2 };
    case "PRO": return { extractions: 7500, filters: 5, fields: 5 };
    case "PRIME": return { extractions: 25000, filters: 10, fields: 10 };
    default: return { extractions: 0, filters: 0, fields: 0 };
  }
}