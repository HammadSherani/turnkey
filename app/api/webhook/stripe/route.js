import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id; 

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          paymentStatus: "active",
          extractionsUsed: 0, 
          lastPaymentDate: new Date()
        } 
      }
    );
    console.log(`Payment success for user: ${userId}`);
  }

  return NextResponse.json({ received: true });
}