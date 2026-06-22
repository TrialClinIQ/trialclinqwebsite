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
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  TotpMultiFactorGenerator,
  getMultiFactorResolver,
  multiFactor,
  type ConfirmationResult,
  type MultiFactorError,
  type MultiFactorResolver,
  type User,
} from 'firebase/auth';
import { auth } from './firebaseConfig';

export type { MultiFactorResolver } from 'firebase/auth';

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
    return userToAuthUser(credential.user);
  } catch (error: any) {
    // Let MFA errors bubble up so Login.tsx can handle the second-factor step
    if (error?.code === 'auth/multi-factor-auth-required') throw error;
    throw new Error(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get current authenticated user — waits for Firebase to restore session from IndexedDB.
 * auth.currentUser is null synchronously on page reload; onAuthStateChanged fires once
 * with the restored user (or null) after the SDK initialises.
 */
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) { resolve(null); return; }
      const parts = (user.displayName || '').split(' ');
      resolve({
        email: user.email || user.phoneNumber || '',
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        role: 'patient',
        userId: user.uid,
      });
    });
  });
}

// ─── MFA helpers ──────────────────────────────────────────────────────────

function userToAuthUser(user: User): AuthUser {
  const parts = (user.displayName || '').split(' ');
  return {
    email: user.email || user.phoneNumber || '',
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    role: 'patient',
    userId: user.uid,
  };
}

/**
 * Inspect a sign-in error. If it's an MFA challenge, return the resolver;
 * otherwise re-throw so callers only need to handle the happy path.
 */
export function extractMFAResolver(err: unknown): MultiFactorResolver | null {
  const e = err as any;
  if (e?.code === 'auth/multi-factor-auth-required') {
    return getMultiFactorResolver(auth, e as MultiFactorError);
  }
  return null;
}

/** What second factors are enrolled on this resolver. */
export function getMFAHints(resolver: MultiFactorResolver) {
  return resolver.hints.map((h) => ({
    uid: h.uid,
    factorId: h.factorId,
    displayName: h.displayName || '',
    // For phone hints the SDK exposes phoneNumber
    phoneNumber: (h as any).phoneNumber as string | undefined,
  }));
}

/** Send an SMS challenge for the enrolled phone second factor. Returns a verificationId. */
export async function sendMFASMS(
  resolver: MultiFactorResolver,
  containerId: string,
): Promise<string> {
  const hint = resolver.hints.find(
    (h) => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID,
  );
  if (!hint) throw new Error('No phone second factor enrolled on this account.');
  const verifier = setupRecaptcha(containerId);
  const provider = new PhoneAuthProvider(auth);
  return provider.verifyPhoneNumber(
    { multiFactorHint: hint, session: resolver.session },
    verifier,
  );
}

/** Complete sign-in using an SMS code. */
export async function completeMFAWithSMS(
  resolver: MultiFactorResolver,
  verificationId: string,
  code: string,
): Promise<AuthUser> {
  const cred = PhoneAuthProvider.credential(verificationId, code);
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  const result = await resolver.resolveSignIn(assertion);
  return userToAuthUser(result.user);
}

/** Complete sign-in using a TOTP code (Google Authenticator / Authy). */
export async function completeMFAWithTOTP(
  resolver: MultiFactorResolver,
  code: string,
): Promise<AuthUser> {
  const hint = resolver.hints.find(
    (h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID,
  );
  if (!hint) throw new Error('No authenticator app second factor enrolled on this account.');
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code);
  const result = await resolver.resolveSignIn(assertion);
  return userToAuthUser(result.user);
}

// ─── Google Sign-In ────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;
  const parts = (user.displayName || '').split(' ');
  return {
    email: user.email || '',
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    role: 'patient',
    userId: user.uid,
  };
}

// ─── Phone / SMS OTP ───────────────────────────────────────────────────────

let _recaptchaVerifier: RecaptchaVerifier | null = null;

/** Attach (or re-attach) an invisible reCAPTCHA to a container element. */
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  if (_recaptchaVerifier) {
    try { _recaptchaVerifier.clear(); } catch (_) {}
    _recaptchaVerifier = null;
  }
  _recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
  return _recaptchaVerifier;
}

/** Send an SMS OTP to the given E.164 phone number. Returns a ConfirmationResult. */
export async function sendPhoneOTP(phone: string, containerId: string): Promise<ConfirmationResult> {
  const verifier = setupRecaptcha(containerId);
  return await signInWithPhoneNumber(auth, phone, verifier);
}

/** Verify the OTP code from the ConfirmationResult. */
export async function verifyPhoneOTP(confirmation: ConfirmationResult, code: string): Promise<AuthUser> {
  const credential = await confirmation.confirm(code);
  const user = credential.user;
  const parts = (user.displayName || '').split(' ');
  return {
    email: user.email || user.phoneNumber || '',
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

// ─── MFA Enrollment ───────────────────────────────────────────────────────────

/** Start TOTP (authenticator app) enrollment. Returns secret + QR code URL. */
export async function startTotpEnrollment(): Promise<{ secret: any; qrCodeUrl: string }> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in.');
  const session = await multiFactor(user).getSession();
  const totpSecret = await TotpMultiFactorGenerator.generateSecret(session);
  const qrCodeUrl = totpSecret.generateQrCodeUrl(user.email || user.uid, 'TrialClinIQ');
  return { secret: totpSecret, qrCodeUrl };
}

/** Complete TOTP enrollment by verifying a code from the user's authenticator app. */
export async function finishTotpEnrollment(secret: any, code: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in.');
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code);
  await multiFactor(user).enroll(assertion, 'Authenticator App');
}

/** Start SMS enrollment for the current user. Returns a verificationId. */
export async function startSmsEnrollment(phone: string, containerId: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in.');
  const session = await multiFactor(user).getSession();
  const verifier = setupRecaptcha(containerId);
  const provider = new PhoneAuthProvider(auth);
  return provider.verifyPhoneNumber({ phoneNumber: phone, session }, verifier);
}

/** Complete SMS enrollment by verifying the code the user received. */
export async function finishSmsEnrollment(verificationId: string, code: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in.');
  const cred = PhoneAuthProvider.credential(verificationId, code);
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  await multiFactor(user).enroll(assertion, 'Phone');
}

/** Return the list of second factors currently enrolled on the signed-in user. */
export async function getEnrolledFactors() {
  const user = auth.currentUser;
  if (!user) return [];
  return multiFactor(user).enrolledFactors;
}

/** Unenroll a second factor by its uid. */
export async function unenrollFactor(factorUid: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in.');
  const mf = multiFactor(user);
  const factor = mf.enrolledFactors.find((f) => f.uid === factorUid);
  if (!factor) throw new Error('Factor not found.');
  await mf.unenroll(factor);
}

// ─────────────────────────────────────────────────────────────────────────────

// Legacy MSAL-compatibility stubs — kept so nothing that imported them breaks
export function initMsal() { return null; }
export function getMsalInstance() { return null; }
