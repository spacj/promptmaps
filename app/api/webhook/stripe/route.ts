import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { updatePremiumStatusAdmin } from '@/lib/firebase-admin';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  // Get Stripe instance (lazy initialization)
  const stripe = getStripe();
  
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`📨 Received webhook event: ${event.type}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Webhook signature verification failed:', errorMessage);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('💳 Checkout session completed:', {
          sessionId: session.id,
          clientReferenceId: session.client_reference_id,
          metadata: session.metadata,
          paymentStatus: session.payment_status,
          customerId: session.customer,
        });

        // Get Firebase UID
        const firebaseUid = session.client_reference_id || session.metadata?.firebaseUid;

        if (!firebaseUid) {
          console.error('❌ No Firebase UID found in session. clientReferenceId:', session.client_reference_id, 'metadata:', session.metadata);
          return NextResponse.json(
            { error: 'No Firebase UID found in session' },
            { status: 400 }
          );
        }

        console.log(`🔍 Found Firebase UID: ${firebaseUid}`);

        // Check if payment is complete
        if (session.payment_status === 'paid') {
          console.log(`✅ Payment confirmed as paid for user ${firebaseUid}`);
          
          const result = await updatePremiumStatusAdmin(firebaseUid, true);
          
          if (result.success) {
            console.log(`🎉 SUCCESS: User ${firebaseUid} upgraded to premium!`);
          } else {
            console.error(`❌ FAILED to upgrade user ${firebaseUid}:`, result.error);
            return NextResponse.json(
              { error: `Failed to update user: ${result.error}` },
              { status: 500 }
            );
          }
        } else {
          console.warn(`⚠️ Payment status is "${session.payment_status}", not "paid"`);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('💰 Payment intent succeeded:', paymentIntent.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = subscription.customer as string;

        console.log(`📋 Subscription updated: ${subscription.id}, status: ${subscription.status}`);

        const sessions = await stripe.checkout.sessions.list({
          customer: customer,
          limit: 1,
        });

        if (sessions.data.length > 0) {
          const firebaseUid = sessions.data[0].client_reference_id || sessions.data[0].metadata?.firebaseUid;

          if (firebaseUid) {
            const isActive = subscription.status === 'active' || subscription.status === 'trialing';
            await updatePremiumStatusAdmin(firebaseUid, isActive);
            console.log(`✅ User ${firebaseUid} subscription updated to: ${subscription.status}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = subscription.customer as string;

        console.log(`🗑️ Subscription deleted: ${subscription.id}`);

        const sessions = await stripe.checkout.sessions.list({
          customer: customer,
          limit: 1,
        });

        if (sessions.data.length > 0) {
          const firebaseUid = sessions.data[0].client_reference_id || sessions.data[0].metadata?.firebaseUid;

          if (firebaseUid) {
            await updatePremiumStatusAdmin(firebaseUid, false);
            console.log(`✅ User ${firebaseUid} subscription cancelled`);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Webhook handler failed: ' + errorMessage },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';