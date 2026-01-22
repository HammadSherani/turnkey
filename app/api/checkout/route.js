import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Plan configuration with prices and metadata
const planConfig = {
  starter: {
    priceId: process.env.STRIPE_PRICE_STARTER || "price_H123456789",
    name: "Starter",
    price: 20,
    features: {
      extractions: 500,
      filters: 2,
      dataFields: 2
    }
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO || "price_H987654321",
    name: "Pro",
    price: 40,
    features: {
      extractions: 2500,
      filters: 5,
      dataFields: 5
    }
  },
  prime: {
    priceId: process.env.STRIPE_PRICE_PRIME || "price_H000000000",
    name: "Prime",
    price: 70,
    features: {
      extractions: 10000,
      filters: 10,
      dataFields: 10
    }
  }
};

export async function POST(req) {
  try {
    // Parse request body
    const body = await req.json();
    const { email, planId } = body;

    // Validation
    if (!email || !planId) {
      return NextResponse.json(
        { error: "Email et plan sont requis", message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide", message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate plan exists
    if (!planConfig[planId]) {
      return NextResponse.json(
        { error: "Plan invalide", message: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Stripe Secret Key is not configured");
      return NextResponse.json(
        { error: "Configuration serveur incorrecte", message: "Stripe not configured" },
        { status: 500 }
      );
    }

    const selectedPlan = planConfig[planId];

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        }
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/auth?plan=${planId}&canceled=true`,
      customer_email: email,
      
      // Metadata for webhook processing
      metadata: {
        email,
        planId,
        planName: selectedPlan.name,
        planPrice: selectedPlan.price,
        extractions: selectedPlan.features.extractions,
        filters: selectedPlan.features.filters,
        dataFields: selectedPlan.features.dataFields,
      },
      
      // Subscription data
      subscription_data: {
        metadata: {
          email,
          planId,
          planName: selectedPlan.name,
        },
        trial_period_days: 0, // Set to 7 or 14 if you want trial period
      },

      // Customer creation
      customer_creation: "always",

      // Allow promotion codes
      allow_promotion_codes: true,

      // Billing address collection
      billing_address_collection: "required",

      // Locale
      locale: "fr",
    });

    // Log successful session creation (for debugging)
    console.log(`Stripe session created for ${email} - Plan: ${selectedPlan.name}`);

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error("Stripe Checkout Error:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeCardError") {
      return NextResponse.json(
        { error: "Erreur de carte", message: error.message },
        { status: 400 }
      );
    }

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        { error: "Requête invalide", message: error.message },
        { status: 400 }
      );
    }

    if (error.type === "StripeAPIError") {
      return NextResponse.json(
        { error: "Erreur API Stripe", message: "Service temporairement indisponible" },
        { status: 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      { 
        error: "Erreur lors de la création de la session de paiement",
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Optional: GET method to retrieve session details
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID requis", message: "Missing session ID" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      status: session.status,
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
    });

  } catch (error) {
    console.error("Stripe Session Retrieval Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la session", message: error.message },
      { status: 500 }
    );
  }
}