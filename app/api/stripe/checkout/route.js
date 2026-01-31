import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    const { priceId, userId } = await req.json();

    const finalUserId = session?.user?.id || userId;

    if (!finalUserId) {
      return NextResponse.json({ error: "User ID missing" }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json({ error: "Price ID missing" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, 
          quantity: 1,
        },
      ],
      client_reference_id: finalUserId, 
      
      success_url: `${process.env.NEXTAUTH_URL}/api/stripe/checkout-success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard`,
      
      // Tax ya Address wagera agar chahiye ho toh (optional)
      automatic_tax: { enabled: false },
    });

    // Stripe ka URL bhej dein taake frontend redirect kar sake
    return NextResponse.json({ url: checkoutSession.url });

  } catch (error) {
    console.error("Stripe Checkout Error:", error.message);
    return NextResponse.json(
      { error: "Initialisation du paiement échouée" }, 
      { status: 500 }
    );
  }
}