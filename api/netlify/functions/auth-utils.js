"use strict";
/**
 * Authentication Utilities for Firebase Auth
 *
 * Verifies Firebase ID tokens using the Firebase Admin SDK.
 * Falls back to simpleAuth session tokens (SHA-256 hash in sessions table).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAndDecodeToken = verifyAndDecodeToken;
exports.getUserFromAuthHeader = getUserFromAuthHeader;
exports.canAccessPatient = canAccessPatient;
exports.isResearcherOwner = isResearcherOwner;
exports.generateInternalUserId = generateInternalUserId;
exports.verifyTokenAndGetUser = verifyTokenAndGetUser;
const admin = require("firebase-admin");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("./db");
// Initialize Firebase Admin (idempotent)
function getAdminApp() {
    if (admin.apps.length > 0) {
        return admin.apps[0];
    }
    return admin.initializeApp();
}
/**
 * Verify a Firebase ID token and return decoded claims.
 */
async function verifyFirebaseToken(token) {
    const app = getAdminApp();
    try {
        return await app.auth().verifyIdToken(token);
    }
    catch (error) {
        throw new Error(`Failed to verify Firebase token: ${error.message}`);
    }
}
/**
 * Verify and decode a Firebase ID token from a Bearer Authorization header.
 */
async function verifyAndDecodeToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid Authorization header');
    }
    const token = authHeader.substring(7);
    try {
        const decoded = await verifyFirebaseToken(token);
        const displayName = decoded.name || '';
        const parts = displayName.split(' ');
        const user = {
            userId: decoded.uid,
            email: decoded.email || '',
            firstName: parts[0] || decoded.given_name || '',
            lastName: parts.slice(1).join(' ') || decoded.family_name || '',
            role: decoded.role || 'patient',
            tenantId: decoded.firebase?.tenant || '',
            oid: decoded.uid,
        };
        if (!user.userId || !user.email) {
            throw new Error('Invalid token: missing user ID or email');
        }
        return user;
    }
    catch (error) {
        console.error('Token verification failed:', error);
        throw new Error(`Unauthorized: ${error.message}`);
    }
}
/**
 * Verify a simpleAuth session token stored in the sessions table.
 */
async function verifySessionToken(token) {
    const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
    const result = await (0, db_1.query)(
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
 */
async function getUserFromAuthHeader(authHeader, cookieHeader) {
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token.includes('.')) {
            try {
                return await verifyAndDecodeToken(authHeader);
            }
            catch {
                // not a valid Firebase JWT, fall through
            }
        }
        try {
            return await verifySessionToken(token);
        }
        catch {
            // fall through to cookie check
        }
    }
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
function canAccessPatient(authenticatedUser, targetPatientId) {
    if (authenticatedUser.role === 'patient') {
        return authenticatedUser.userId === targetPatientId;
    }
    return true;
}
/**
 * Check if researcher/provider owns the profile
 */
function isResearcherOwner(authenticatedUser, researcherId) {
    return authenticatedUser.userId === researcherId || authenticatedUser.role === 'provider';
}
/**
 * Generate internal user ID for database (kept for backward compatibility)
 */
function generateInternalUserId(uid) {
    return `firebase-${uid}`;
}
/**
 * Verify token and get user from event or auth header string.
 */
async function verifyTokenAndGetUser(eventOrAuthHeader) {
    if (typeof eventOrAuthHeader === 'string') {
        return getUserFromAuthHeader(eventOrAuthHeader);
    }
    const authHeader = eventOrAuthHeader?.headers?.authorization ||
        eventOrAuthHeader?.headers?.Authorization || '';
    const cookieHeader = eventOrAuthHeader?.headers?.cookie || '';
    return getUserFromAuthHeader(authHeader || undefined, cookieHeader || undefined);
}
