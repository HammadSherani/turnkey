import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// NEXT.JS APP ROUTER KE LIYE YE ZAROORI HAI
export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.text(); // Raw body zaroori hai signature ke liye
  const signature = req.headers.get("stripe-signature");

  console.log("🔔 WEBHOOK HIT DETECTED");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ SIGNATURE ERROR:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Session Completed Event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;

    console.log("👤 PROCESSING USER ID:", userId);

    try {
      const client = await clientPromise;
      const db = client.db();

      // Price ID ke mutabiq limits set karein
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0].price.id;

      let planName = "STARTER";
      let limits = { extractions: 1500, filters: 3, fields: 3 };

      if (priceId === process.env.NEXT_PUBLIC_PRO_PRICE_ID) {
        planName = "PRO";
        limits = { extractions: 7500, filters: 5, fields: 5 };
      } else if (priceId === process.env.NEXT_PUBLIC_PRIME_PRICE_ID) {
        planName = "PRIME";
        limits = { extractions: 25000, filters: 10, fields: 10 };
      }

      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            plan: planName,
            paymentStatus: "active",
            extractionsUsed: 0, 
            limits: limits,     
            updatedAt: new Date()
          } 
        }
      );
      console.log(`✅ DATABASE UPDATED FOR: ${userId}`);
    } catch (dbErr) {
      console.error("❌ DATABASE UPDATE FAILED:", dbErr.message);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}