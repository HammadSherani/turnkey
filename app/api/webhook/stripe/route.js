import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 1. ZAROORI: Next.js ko batayein ke ye route dynamic hai
export const dynamic = "force-dynamic";

// 2. POST function ka naam bade harfo mein (Capital) hona chahiye
export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  // Debugging ke liye Vercel logs mein dikhega
  console.log("🔔 Webhook received at:", new Date().toISOString());

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`❌ Signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 3. Logic for checkout session completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    
    // Aapke JSON mein client_reference_id sahi aa rahi hai
    const userId = session.client_reference_id; 

    try {
      const client = await clientPromise;
      const db = client.db();

      // Price ID nikalna plan identification ke liye
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

      const updateResult = await db.collection("users").updateOne(
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

      console.log(`✅ Success for ${userId}:`, updateResult.modifiedCount);
    } catch (dbError) {
      console.error("❌ DB Update Error:", dbError.message);
    }
  }

  // Hamesha 200 response dena zaroori hai
  return NextResponse.json({ received: true }, { status: 200 });
}

// 4. Ye line ensure karti hai ke 405 error na aaye
export async function GET() {
    return new NextResponse("Method Not Allowed", { status: 405 });
}