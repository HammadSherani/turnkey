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
    console.error("❌ Webhook Signature Error");
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id; 

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
          lastPaymentDate: new Date(),
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`✅ Success: Plan ${planName} activated and usage reset for user: ${userId}`);
  }

  return NextResponse.json({ received: true });
}