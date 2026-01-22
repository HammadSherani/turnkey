import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb"; // Adjust path as needed
import User from "@/models/User"; // Adjust path as needed

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Handle successful checkout
async function handleCheckoutSessionCompleted(session) {
  console.log("Checkout session completed:", session.id);

  const { email, planId, planName } = session.metadata;

  await connectDB();

  // Update user status to active
  const user = await User.findOneAndUpdate(
    { email },
    {
      status: "active",
      plan: planId,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      subscriptionStatus: "active",
      subscriptionStartDate: new Date(),
    },
    { new: true }
  );

  if (user) {
    console.log(`User ${email} activated with ${planName} plan`);
  } else {
    console.error(`User not found: ${email}`);
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription) {
  console.log("Subscription created:", subscription.id);

  const { email, planId } = subscription.metadata;

  await connectDB();

  await User.findOneAndUpdate(
    { email },
    {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    }
  );
}

// Handle subscription updates (plan changes, renewals)
async function handleSubscriptionUpdated(subscription) {
  console.log("Subscription updated:", subscription.id);

  await connectDB();

  await User.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      subscriptionStatus: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      status: subscription.status === "active" ? "active" : "inactive",
    }
  );
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription) {
  console.log("Subscription deleted:", subscription.id);

  await connectDB();

  await User.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      status: "canceled",
      subscriptionStatus: "canceled",
      canceledAt: new Date(),
    }
  );
}

// Handle successful invoice payment (renewals)
async function handleInvoicePaymentSucceeded(invoice) {
  console.log("Invoice payment succeeded:", invoice.id);

  await connectDB();

  await User.findOneAndUpdate(
    { stripeCustomerId: invoice.customer },
    {
      status: "active",
      subscriptionStatus: "active",
      lastPaymentDate: new Date(),
      lastPaymentAmount: invoice.amount_paid,
    }
  );
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice) {
  console.log("Invoice payment failed:", invoice.id);

  await connectDB();

  await User.findOneAndUpdate(
    { stripeCustomerId: invoice.customer },
    {
      status: "payment_failed",
      subscriptionStatus: "past_due",
      lastPaymentFailedDate: new Date(),
    }
  );

  // TODO: Send email notification to user about failed payment
}

// Disable body parsing for webhook routes
export const config = {
  api: {
    bodyParser: false,
  },
};