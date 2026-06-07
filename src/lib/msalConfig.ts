/**
 * Firebase configuration re-export.
 * This file previously held MSAL (Azure Entra ID) configuration.
 * It is kept so that any existing imports of msalConfig do not break.
 */

export { auth, default as firebaseApp } from './firebaseConfig';

// Compatibility stubs for any code that still references the old MSAL exports.
export const msalConfig = {};
export const loginRequest = { scopes: [] };
export const tokenRequest = { scopes: [] };
export const silentRequest = { scopes: [], forceRefresh: false };
