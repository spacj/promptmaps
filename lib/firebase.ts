import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// User data interface
export interface UserData {
  email: string;
  isPremium: boolean;
  creditsUsedToday: number;
  lastResetDate: string;
  createdAt: string;
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user document exists, if not create it
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      const userData: UserData = {
        email: user.email || '',
        isPremium: false,
        creditsUsedToday: 0,
        lastResetDate: new Date().toDateString(),
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
    }
    
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Sign up new user
export async function signUp(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    const userData: UserData = {
      email: user.email || '',
      isPremium: false,
      creditsUsedToday: 0,
      lastResetDate: new Date().toDateString(),
      createdAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Sign in existing user
export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Sign out
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get user data from Firestore
export async function getUserData(uid: string): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

// Check and reset daily credits if needed
export async function checkAndResetCredits(uid: string): Promise<{ credits: number; isPremium: boolean }> {
  try {
    const userData = await getUserData(uid);
    if (!userData) return { credits: 0, isPremium: false };

    const today = new Date().toDateString();
    
    // If premium, return unlimited (represented as 999)
    if (userData.isPremium) {
      return { credits: 999, isPremium: true };
    }

    // Check if we need to reset credits
    if (today !== userData.lastResetDate) {
      // Reset credits for new day
      await updateDoc(doc(db, 'users', uid), {
        creditsUsedToday: 0,
        lastResetDate: today,
      });
      return { credits: 3, isPremium: false };
    }

    // Return remaining credits
    const remainingCredits = Math.max(0, 3 - userData.creditsUsedToday);
    return { credits: remainingCredits, isPremium: false };
  } catch (error) {
    console.error('Error checking credits:', error);
    return { credits: 0, isPremium: false };
  }
}

// Use a credit
export async function useCredit(uid: string): Promise<boolean> {
  try {
    const userData = await getUserData(uid);
    if (!userData) return false;

    // Premium users have unlimited credits
    if (userData.isPremium) return true;

    const today = new Date().toDateString();
    
    // Reset if new day
    if (today !== userData.lastResetDate) {
      await updateDoc(doc(db, 'users', uid), {
        creditsUsedToday: 1,
        lastResetDate: today,
      });
      return true;
    }

    // Check if user has credits left
    if (userData.creditsUsedToday >= 3) {
      return false;
    }

    // Increment credits used
    await updateDoc(doc(db, 'users', uid), {
      creditsUsedToday: userData.creditsUsedToday + 1,
    });
    
    return true;
  } catch (error) {
    console.error('Error using credit:', error);
    return false;
  }
}

// Update user premium status (called after successful payment)
export async function updatePremiumStatus(uid: string, isPremium: boolean) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      isPremium,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Auth state observer
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { app, auth, db };