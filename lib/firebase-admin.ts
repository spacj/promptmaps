import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

let app: App;
let adminDb: Firestore;

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    console.log('🔧 Initializing Firebase Admin...');
    
    try {
      // Try using service account JSON file
      const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        console.log('📄 Found serviceAccountKey.json, loading...');
        
        // Read and parse the JSON file
        const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountContent);
        
        // Clean the private key - replace literal \n with actual newlines
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        
        app = initializeApp({
          credential: cert(serviceAccount),
        });
        
        console.log('✅ Firebase Admin initialized with JSON file');
        console.log('📧 Using service account:', serviceAccount.client_email);
      } else {
        // Fall back to environment variables
        console.log('📝 JSON file not found, using environment variables...');
        
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
          throw new Error('Missing Firebase Admin credentials. Please create serviceAccountKey.json or set environment variables.');
        }

        // Clean up the private key
        // Remove surrounding quotes if present
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        }
        if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
          privateKey = privateKey.slice(1, -1);
        }
        
        // Replace literal \n with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');

        console.log('🔑 Private key cleaned, length:', privateKey.length);

        app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        
        console.log('✅ Firebase Admin initialized with environment variables');
        console.log('📧 Using service account:', clientEmail);
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize Firebase Admin:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  } else {
    app = getApps()[0];
  }
  
  adminDb = getFirestore(app);
  
  // Test the connection
  console.log('🔌 Testing Firestore connection...');
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
   
    // First check if document exists
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
   
    // Perform the update - use update() instead of set() with merge
    // This is more explicit and safer
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
   
    // Verify the update with a small delay
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
   
    // Confirm the field was actually updated
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

// Add a test function to verify admin access
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