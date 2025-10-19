import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let adminDb: Firestore;

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    console.log('🔧 Initializing Firebase Admin...');
    
    try {
      // Priority 1: Check for base64 encoded service account (easiest for Vercel)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        console.log('📦 Using base64 encoded service account JSON');
        const serviceAccountJson = Buffer.from(
          process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
          'base64'
        ).toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountJson);
        
        app = initializeApp({
          credential: cert(serviceAccount),
        });
        
        console.log('✅ Firebase Admin initialized with base64 service account');
        console.log('📧 Using service account:', serviceAccount.client_email);
      }
      // Priority 2: Check for individual environment variables
      else if (
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
        (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64)
      ) {
        console.log('📝 Using individual environment variables...');
        
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        let privateKey: string;

        // Try base64 encoded key first
        if (process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64) {
          console.log('🔐 Using base64 encoded private key');
          privateKey = Buffer.from(
            process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64,
            'base64'
          ).toString('utf8');
        } 
        // Fallback to regular private key
        else if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
          console.log('🔑 Using plain private key');
          privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
          
          // Clean up the private key - remove quotes if present
          if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
          }
          if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
            privateKey = privateKey.slice(1, -1);
          }
          
          // Replace literal \n with actual newlines
          privateKey = privateKey.replace(/\\n/g, '\n');
        } else {
          throw new Error('FIREBASE_ADMIN_PRIVATE_KEY or FIREBASE_ADMIN_PRIVATE_KEY_BASE64 is required');
        }

        console.log('🔑 Private key length:', privateKey.length);
        console.log('📧 Using service account:', clientEmail);

        app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        
        console.log('✅ Firebase Admin initialized with environment variables');
      }
      // Priority 3: Try loading from file (development only)
      else if (process.env.NODE_ENV === 'development') {
        console.log('📄 Development mode: attempting to load serviceAccountKey.json...');
        
        try {
          const serviceAccount = require('../serviceAccountKey.json');
          
          // Clean the private key
          if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
          }
          
          app = initializeApp({
            credential: cert(serviceAccount),
          });
          
          console.log('✅ Firebase Admin initialized with JSON file');
          console.log('📧 Using service account:', serviceAccount.client_email);
        } catch (fileError) {
          console.error('❌ Could not load serviceAccountKey.json:', fileError);
          throw new Error(
            'Development: serviceAccountKey.json not found and no environment variables set. ' +
            'Please create serviceAccountKey.json or set FIREBASE_ADMIN environment variables.'
          );
        }
      }
      // No credentials found
      else {
        const errorMsg = 
          '❌ Missing Firebase Admin credentials!\n' +
          'Please set one of the following:\n' +
          '1. FIREBASE_SERVICE_ACCOUNT_BASE64 (recommended for Vercel)\n' +
          '2. FIREBASE_ADMIN_PRIVATE_KEY + FIREBASE_ADMIN_CLIENT_EMAIL + NEXT_PUBLIC_FIREBASE_PROJECT_ID\n' +
          '3. Create serviceAccountKey.json (development only)';
        
        console.error(errorMsg);
        throw new Error('Missing Firebase Admin credentials');
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize Firebase Admin:', error);
      console.error('Error details:', error.message);
      
      // Log which environment variables are present (for debugging)
      console.log('Environment check:', {
        hasServiceAccountBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        hasPrivateKeyBase64: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64,
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
      });
      
      throw error;
    }
  } else {
    app = getApps()[0];
    console.log('✅ Firebase Admin already initialized');
  }
  
  adminDb = getFirestore(app);
  console.log('🔌 Firestore connection ready');
  
  return adminDb;
}

// Initialize on module load
initializeFirebaseAdmin();

export async function updatePremiumStatusAdmin(uid: string, isPremium: boolean) {
  try {
    console.log(`🔄 Attempting to update user ${uid} to isPremium: ${isPremium}`);
    
    if (!adminDb) {
      console.error('❌ Admin DB not initialized!');
      throw new Error('Admin DB not initialized');
    }
   
    const userRef = adminDb.collection('users').doc(uid);
    
    let userDoc;
    try {
      userDoc = await userRef.get();
    } catch (error: any) {
      console.error('❌ Error fetching user document:', error);
      throw new Error(`Failed to fetch user document: ${error.message}`);
    }
   
    if (!userDoc.exists) {
      console.error(`❌ User document does not exist for uid: ${uid}`);
      throw new Error('User document not found');
    }
   
    const currentData = userDoc.data();
    console.log(`📄 Current user data:`, currentData);
   
    const updateData = {
      isPremium: isPremium,
      updatedAt: new Date().toISOString(),
    };
    
    console.log('📝 Updating with data:', updateData);
    
    try {
      await userRef.update(updateData);
      console.log('✅ Update command executed');
    } catch (error: any) {
      console.error('❌ Error executing update:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
   
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let updatedDoc;
    try {
      updatedDoc = await userRef.get();
    } catch (error: any) {
      console.error('❌ Error fetching updated document:', error);
      throw new Error(`Failed to verify update: ${error.message}`);
    }
    
    const updatedData = updatedDoc.data();
    console.log(`📄 Updated user data:`, updatedData);
   
    if (updatedData?.isPremium !== isPremium) {
      console.error(`❌ Update didn't persist! Expected isPremium: ${isPremium}, got: ${updatedData?.isPremium}`);
      throw new Error(`Update didn't persist. Expected: ${isPremium}, Got: ${updatedData?.isPremium}`);
    }
   
    console.log(`✅ Successfully updated user ${uid} to isPremium: ${isPremium}`);
    return { success: true, data: updatedData };
  } catch (error: any) {
    console.error(`❌ Error updating premium status for user ${uid}:`, error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return { success: false, error: error.message };
  }
}

export async function testAdminAccess() {
  try {
    const testRef = adminDb.collection('_admin_test').doc('test');
    await testRef.set({ test: true, timestamp: new Date().toISOString() });
    await testRef.delete();
    console.log('✅ Admin write access confirmed');
    return true;
  } catch (error: any) {
    console.error('❌ Admin write access failed:', error);
    return false;
  }
}

export { adminDb };