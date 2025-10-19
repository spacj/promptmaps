import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updatePremiumStatusAdmin, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId } = body;
   
    console.log('\n🔍 ===== PAYMENT VERIFICATION STARTED =====');
    console.log('  Session ID:', sessionId);
    console.log('  User ID:', userId);

    if (!sessionId || !userId) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        {
          success: false,
          error: 'Session ID and User ID required',
          details: { sessionId: !!sessionId, userId: !!userId }
        },
        { status: 400 }
      );
    }

    // Step 1: Retrieve session from Stripe FIRST
    console.log('\n📋 Step 1: Fetching session from Stripe...');
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError: any) {
      console.error('❌ Stripe API error:', stripeError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid session ID or Stripe error',
          details: stripeError.message,
        },
        { status: 400 }
      );
    }
   
    console.log('✅ Session retrieved from Stripe');
    console.log('📊 Session details:', {
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer: session.customer,
      client_reference_id: session.client_reference_id,
      metadata: session.metadata,
    });

    // Step 2: Verify payment status
    console.log('\n📋 Step 2: Checking payment status...');
    if (session.payment_status !== 'paid') {
      console.warn(`⚠️ Payment not completed. Status: ${session.payment_status}`);
      return NextResponse.json({
        success: false,
        error: `Payment status is "${session.payment_status}", not "paid"`,
        paymentStatus: session.payment_status,
      }, { status: 400 });
    }
    
    console.log('✅ Payment confirmed as PAID');

    // Step 3: Verify user exists in Firebase
    console.log('\n📋 Step 3: Checking if user exists in Firebase...');
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error(`❌ User document does not exist for uid: ${userId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'User not found in Firebase',
          userId: userId,
        },
        { status: 404 }
      );
    }
    
    const currentUserData = userDoc.data();
    console.log('✅ User found in Firebase');
    console.log('📄 Current user data:', currentUserData);

    // Step 4: Check if already premium (idempotency check)
    if (currentUserData?.isPremium === true) {
      console.log('ℹ️ User is already premium, skipping update');
      return NextResponse.json({
        success: true,
        isPremium: true,
        message: 'User is already premium',
        userData: currentUserData,
      });
    }

    // Step 5: Update user to premium with retry logic
    console.log('\n📋 Step 4: Updating user to premium...');
    console.log(`🔄 Calling updatePremiumStatusAdmin(${userId}, true)`);
    
    let updateResult;
    let retries = 3;
    
    while (retries > 0) {
      updateResult = await updatePremiumStatusAdmin(userId, true);
      
      if (updateResult.success) {
        break;
      }
      
      retries--;
      console.warn(`⚠️ Update failed, ${retries} retries remaining...`);
      
      if (retries > 0) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      }
    }
    
    console.log('📊 Update result:', updateResult);
    
    if (!updateResult || !updateResult.success) {
      console.error(`❌ Failed to update user after retries: ${updateResult?.error}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update database: ' + (updateResult?.error || 'Unknown error'),
          details: updateResult
        },
        { status: 500 }
      );
    }

    // Step 6: Verify the update actually worked with retry
    console.log('\n📋 Step 5: Verifying update persisted...');
    let verifyData;
    let verifyRetries = 3;
    
    while (verifyRetries > 0) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for propagation
      
      const verifyDoc = await userRef.get();
      verifyData = verifyDoc.data();
      
      console.log('📄 User data after update (attempt', 4 - verifyRetries, '):', verifyData);
      
      if (verifyData?.isPremium === true) {
        console.log('✅ Verification successful! User is now premium.');
        break;
      }
      
      verifyRetries--;
      console.warn(`⚠️ Verification failed, ${verifyRetries} retries remaining...`);
    }
    
    if (verifyData?.isPremium !== true) {
      console.error('❌ CRITICAL: Update succeeded but isPremium is still not true after retries!');
      console.error('Expected isPremium: true');
      console.error('Actual isPremium:', verifyData?.isPremium);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Update succeeded but verification failed after retries',
          expected: true,
          actual: verifyData?.isPremium,
          userData: verifyData,
        },
        { status: 500 }
      );
    }
    
    console.log('🎉 ===== PAYMENT VERIFICATION COMPLETED SUCCESSFULLY =====\n');
    
    return NextResponse.json({
      success: true,
      isPremium: true,
      message: 'Premium status updated successfully',
      userData: verifyData,
    });
    
  } catch (error: any) {
    console.error('\n❌ ===== PAYMENT VERIFICATION FAILED =====');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        type: error.name,
        code: error.code,
      },
      { status: 500 }
    );
  }
}