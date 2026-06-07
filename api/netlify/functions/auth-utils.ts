/**
 * Authentication Utilities for Firebase Auth
 *
 * This module provides secure Firebase ID token verification for API functions.
 *
 * SECURITY FEATURES:
 * - Firebase ID token verification via Firebase Admin SDK
 * - Token expiration validation handled by the SDK
 * - Session token fallback (SHA-256 hash stored in sessions table)
 *
 * ENVIRONMENT VARIABLES:
 * - GOOGLE_APPLICATION_CREDENTIALS: path to service account JSON (local dev)
 *   On GCP/Cloud Run/Netlify with Workload Identity this is not required.
 *
 * USAGE:
 * ```typescript
 * const user = await verifyTokenAndGetUser(event);
 * ```
 *
 * @module auth-utils
 */

import * as admin from 'firebase-admin';
import crypto from 'crypto';
import { query } from './db';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'patient' | 'provider' | 'researcher';
  tenantId: string;
  oid: string; // kept for interface compatibility; maps to Firebase uid
}

// Initialize Firebase Admin (idempotent)
function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }
  return admin.initializeApp();
}

/**
 * Verify a Firebase ID token and return the decoded claims.
 */
async function verifyFirebaseToken(token: string): Promise<admin.auth.DecodedIdToken> {
  const app = getAdminApp();
  try {
    return await app.auth().verifyIdToken(token);
  } catch (error: any) {
    throw new Error(`Failed to verify Firebase token: ${error.message}`);
  }
}

/**
 * Verify and decode a Firebase ID token from a Bearer Authorization header.
 */
export async function verifyAndDecodeToken(authHeader: string): Promise<AuthenticatedUser> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.substring(7);

  try {
    const decoded = await verifyFirebaseToken(token);

    const displayName: string = (decoded as any).name || '';
    const parts = displayName.split(' ');

    const user: AuthenticatedUser = {
      userId: decoded.uid,
      email: decoded.email || '',
      firstName: parts[0] || (decoded as any).given_name || '',
      lastName: parts.slice(1).join(' ') || (decoded as any).family_name || '',
      role: ((decoded as any).role as AuthenticatedUser['role']) || 'patient',
      tenantId: decoded.firebase?.tenant || '',
      oid: decoded.uid,
    };

    if (!user.userId || !user.email) {
      throw new Error('Invalid token: missing user ID or email');
    }

    return user;
  } catch (error: any) {
    console.error('Token verification failed:', error);
    throw new Error(`Unauthorized: ${error.message}`);
  }
}

/**
 * Verify a simpleAuth session token (from httpOnly cookie or Bearer header).
 * These are random hex tokens hashed with SHA-256 and stored in the sessions table.
 */
async function verifySessionToken(token: string): Promise<AuthenticatedUser> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const result = await query(
    `SELECT s.user_id, u.email, u.first_name, u.last_name, u.role
     FROM sessions s
     JOIN users u ON s.user_id = u.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired session token');
  }

  const row = result.rows[0];
  return {
    userId: row.user_id,
    email: row.email,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    role: row.role || 'patient',
    tenantId: '',
    oid: '',
  };
}

/**
 * Extract user info from Authorization header or session cookie.
 * Supports both Firebase ID tokens (JWTs) and simpleAuth session tokens.
 */
export async function getUserFromAuthHeader(authHeader?: string, cookieHeader?: string): Promise<AuthenticatedUser> {
  // Try Bearer token first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // Firebase ID tokens are JWTs (contain dots); try Firebase verification first
    if (token.includes('.')) {
      try {
        return await verifyAndDecodeToken(authHeader);
      } catch {
        // Not a valid Firebase JWT — fall through to session token check
      }
    }

    // Treat as a simpleAuth session token
    try {
      return await verifySessionToken(token);
    } catch {
      // fall through to cookie check
    }
  }

  // Try session cookie (simpleAuth httpOnly cookie)
  if (cookieHeader) {
    const match = cookieHeader.match(/session_token=([^;]+)/);
    if (match?.[1]) {
      return await verifySessionToken(match[1]);
    }
  }

  throw new Error('Missing or invalid authentication');
}

/**
 * Check if user has permission to access a specific patient's data
 */
export function canAccessPatient(
  authenticatedUser: AuthenticatedUser,
  targetPatientId: string
): boolean {
  if (authenticatedUser.role === 'patient') {
    return authenticatedUser.userId === targetPatientId;
  }
  return true;
}

/**
 * Check if researcher/provider owns the profile
 */
export function isResearcherOwner(
  authenticatedUser: AuthenticatedUser,
  researcherId: string
): boolean {
  return authenticatedUser.userId === researcherId || authenticatedUser.role === 'provider';
}

/**
 * Generate internal user ID for database (kept for backward compatibility)
 */
export function generateInternalUserId(uid: string): string {
  return `firebase-${uid}`;
}

/**
 * Verify token and get user from event or auth header string.
 * Accepts either a HandlerEvent object or an auth header string for backward compatibility.
 */
export async function verifyTokenAndGetUser(eventOrAuthHeader: any): Promise<AuthenticatedUser> {
  if (typeof eventOrAuthHeader === 'string') {
    return getUserFromAuthHeader(eventOrAuthHeader);
  }

  const authHeader = eventOrAuthHeader?.headers?.authorization ||
                     eventOrAuthHeader?.headers?.Authorization || '';
  const cookieHeader = eventOrAuthHeader?.headers?.cookie || '';

  return getUserFromAuthHeader(authHeader || undefined, cookieHeader || undefined);
}
