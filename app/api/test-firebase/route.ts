// Create this file at: app/api/test-firebase/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Firebase Admin...');
    
    // Check environment variables
    const hasProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const hasClientEmail = !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const hasPrivateKey = !!process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    
    console.log('Environment check:', { hasProjectId, hasClientEmail, hasPrivateKey });
    
    if (!hasProjectId || !hasClientEmail || !hasPrivateKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: { hasProjectId, hasClientEmail, hasPrivateKey }
      }, { status: 500 });
    }

    // Try to list collections
    const collections = await adminDb.listCollections();
    console.log('Collections:', collections.map(c => c.id));

    // Try to read users collection
    const usersSnapshot = await adminDb.collection('users').limit(1).get();
    console.log('Users collection size:', usersSnapshot.size);

    return NextResponse.json({
      success: true,
      message: 'Firebase Admin is working!',
      collections: collections.map(c => c.id),
      usersCount: usersSnapshot.size,
      envCheck: { hasProjectId, hasClientEmail, hasPrivateKey }
    });
  } catch (error: any) {
    console.error('❌ Firebase Admin test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId required',
      }, { status: 400 });
    }

    console.log('🧪 Testing write access for user:', userId);

    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        userId,
      }, { status: 404 });
    }

    const beforeData = userDoc.data();
    console.log('📄 Before update:', beforeData);

    // Try to update with merge
    await userRef.set({
      isPremium: true,
      testUpdate: new Date().toISOString(),
    }, { merge: true });

    // Verify the update
    const afterDoc = await userRef.get();
    const afterData = afterDoc.data();
    console.log('📄 After update:', afterData);

    const updateWorked = afterData?.isPremium === true;

    return NextResponse.json({
      success: updateWorked,
      message: updateWorked ? 'Update successful!' : 'Update failed to persist',
      before: beforeData,
      after: afterData,
      userId,
    });
  } catch (error: any) {
    console.error('❌ Test update failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
    }, { status: 500 });
  }
}