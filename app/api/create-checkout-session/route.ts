import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`🛒 Creating checkout session for user: ${userId}`);

    // Get the base URL - try multiple methods
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    // If not set, try to get from request headers
    if (!baseUrl) {
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      if (host) {
        baseUrl = `${protocol}://${host}`;
      }
    }
    
    // Fallback to localhost
    if (!baseUrl) {
      baseUrl = 'http://localhost:3000';
    }

    console.log(`🌐 Using base URL: ${baseUrl}`);

    // Validate the URL
    if (!baseUrl || baseUrl === 'undefined' || baseUrl.includes('undefined')) {
      console.error('❌ Base URL is not configured properly!');
      return NextResponse.json(
        { error: 'Server configuration error: Base URL not set. Please add NEXT_PUBLIC_BASE_URL to your environment variables.' },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Premium Subscription',
              description: 'Unlimited AI prompts',
            },
            unit_amount: 999, // $9.99
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
      client_reference_id: userId, // THIS IS CRITICAL!
      metadata: {
        firebaseUid: userId, // Backup method
      },
    });

    console.log(`✅ Checkout session created: ${session.id}`);
    console.log(`✅ Success URL: ${baseUrl}/success`);
    console.log(`✅ Cancel URL: ${baseUrl}/cancel`);

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}