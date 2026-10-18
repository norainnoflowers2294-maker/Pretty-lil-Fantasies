import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    // Wait until Firebase has restored any saved session. Never probe a
    // forbidden test path: the app rules intentionally allow each user to
    // read only their own backup document.
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) return false;

    await getDocFromServer(doc(db, 'users', user.uid));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is offline or uninitialized.');
    }
    return false;
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  // This app is hosted on GitHub Pages. Firebase redirect auth on non-Firebase
  // hosts needs additional hosting/proxy setup, so use its popup flow and
  // surface blocked-popup errors to the user instead of silently redirecting.
  return signInWithPopup(auth, provider);
}

interface GoogleDriveTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}
interface GoogleDriveTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}
interface GoogleIdentityServices {
  accounts?: {
    oauth2?: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleDriveTokenResponse) => void;
        error_callback?: (error: { type?: string; message?: string }) => void;
      }) => GoogleDriveTokenClient;
    };
  };
}

async function loadGoogleIdentityServices(): Promise<GoogleIdentityServices> {
  const browserWindow = window as Window & { google?: GoogleIdentityServices };
  if (browserWindow.google?.accounts?.oauth2?.initTokenClient) return browserWindow.google;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google sign-in could not load. Check your connection and try again.')), { once: true });
      if ((window as Window & { google?: GoogleIdentityServices }).google?.accounts?.oauth2?.initTokenClient) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google sign-in could not load. Check your connection and try again.'));
    document.head.appendChild(script);
  });
  const services = (window as Window & { google?: GoogleIdentityServices }).google;
  if (!services?.accounts?.oauth2?.initTokenClient) throw new Error('Google Drive sign-in is unavailable in this browser.');
  return services;
}

export async function signInWithGoogleDrive(): Promise<{ accessToken: string }> {
  const services = await loadGoogleIdentityServices();
  return new Promise((resolve, reject) => {
    try {
      const tokenClient = services.accounts!.oauth2!.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error_description || response.error || 'Google did not grant Drive access. Please try again.'));
            return;
          }
          resolve({ accessToken: response.access_token });
        },
        error_callback: (error) => reject(new Error(error.message || 'Google Drive sign-in did not finish.')),
      });
      tokenClient.requestAccessToken({ prompt: 'consent select_account' });
    } catch (error) {
      reject(error);
    }
  });
}

export async function logOutFirebase() {
  return signOut(auth);
}

testConnection();
