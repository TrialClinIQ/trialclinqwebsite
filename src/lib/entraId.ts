/**
 * Firebase Authentication Module
 * Replaces Azure Entra ID (MSAL) with Firebase Auth
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './firebaseConfig';

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthUser {
  email: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'provider';
  userId: string;
}

/**
 * Sign up a new user with Firebase Auth
 */
export async function signUpUser(input: SignUpInput): Promise<{ userId: string; requiresConfirmation: boolean }> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);

    await updateProfile(credential.user, {
      displayName: `${input.firstName} ${input.lastName}`.trim(),
    });

    return {
      userId: credential.user.uid,
      requiresConfirmation: false,
    };
  } catch (error) {
    throw new Error(`Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Confirm user MFA (no-op for Firebase — handled by Firebase Console if enabled)
 */
export async function confirmUserMFA(_email: string, _mfaCode: string): Promise<void> {
  console.log('MFA confirmation handled by Firebase Auth');
}

/**
 * Resend MFA code (no-op for Firebase — handled by Firebase Console if enabled)
 */
export async function resendMFACode(_email: string): Promise<void> {
  console.log('MFA code resend handled by Firebase Auth');
}

/**
 * Sign in user with email and password
 */
export async function signInUser(input: SignInInput): Promise<AuthUser | null> {
  try {
    const credential = await signInWithEmailAndPassword(auth, input.email, input.password);
    const user = credential.user;

    const displayName = user.displayName || '';
    const parts = displayName.split(' ');

    return {
      email: user.email || input.email,
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      role: 'patient',
      userId: user.uid,
    };
  } catch (error) {
    throw new Error(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  const displayName = user.displayName || '';
  const parts = displayName.split(' ');

  return {
    email: user.email || '',
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    role: 'patient',
    userId: user.uid,
  };
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a user is currently authenticated
 */
export async function isUserAuthenticated(): Promise<boolean> {
  return auth.currentUser !== null;
}

/**
 * Get Firebase ID token for API calls
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return (await auth.currentUser?.getIdToken()) ?? null;
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
}

/**
 * Refresh Firebase ID token
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    return (await auth.currentUser?.getIdToken(/* forceRefresh */ true)) ?? null;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
}

/**
 * Get user profile (alias for getCurrentAuthUser)
 */
export async function getUserProfile(): Promise<AuthUser | null> {
  return getCurrentAuthUser();
}

// Legacy MSAL-compatibility stubs — kept so nothing that imported them breaks
export function initMsal() { return null; }
export function getMsalInstance() { return null; }
