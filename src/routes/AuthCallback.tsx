import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { consumePostLoginRedirect, useAuth } from '../lib/auth';
import { getAccessToken } from '../lib/entraId';
import { auth } from '../lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { generatePatientId } from '../lib/patientIdUtils';
import { generateProviderId } from '../lib/providerIdUtils';
import { savePatientProfile, saveProviderProfile } from '../lib/storage';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  useEffect(() => {
    const pendingRole = (localStorage.getItem('pending_role_v1') as 'patient' | 'provider' | null) || 'patient';
    const pendingSignupRaw = localStorage.getItem('pending_signup_v1');
    const pendingSignup = pendingSignupRaw ? JSON.parse(pendingSignupRaw) : null;
    const dashboardPath = pendingRole === 'provider' ? '/providers/dashboard' : '/patients/health-profile';
    const loginPath = pendingRole === 'provider' ? '/providers/login' : '/patients/login';
    const postLoginPath = consumePostLoginRedirect(dashboardPath);

    const normalizeEmail = (value?: string) => (value || '').trim().toLowerCase();
    const pendingEmail = normalizeEmail(pendingSignup?.email);

    // Firebase Auth state resolves synchronously on page load once the SDK
    // has initialised (usually within one tick). onAuthStateChanged fires
    // immediately with the current user or null.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe(); // only need the first emission

      if (!firebaseUser) {
        localStorage.removeItem('pending_role_v1');
        localStorage.removeItem('pending_signup_v1');
        navigate(loginPath, {
          replace: true,
          state: { authMessage: 'Sign-in was not completed. Please try again or create an account.' },
        });
        return;
      }

      // Enforce email match to pending signup data
      const accountEmail = normalizeEmail(firebaseUser.email || '');
      if (pendingEmail && accountEmail && pendingEmail !== accountEmail) {
        localStorage.removeItem('pending_role_v1');
        localStorage.removeItem('pending_signup_v1');
        navigate(loginPath, {
          replace: true,
          state: {
            authMessage: `Please sign in with ${pendingSignup?.email} to finish creating your account.`,
          },
        });
        return;
      }

      const role = pendingRole;
      const displayName = firebaseUser.displayName || '';
      const parts = displayName.split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      signIn({
        email: firebaseUser.email || '',
        firstName,
        lastName,
        role,
        userId: firebaseUser.uid,
      });

      // Best-effort: sync user record in backend so account exists server-side immediately
      try {
        const token = await getAccessToken();
        if (token) {
          await fetch('/api/whoami', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });

          const user = {
            email: firebaseUser.email || '',
            firstName,
            lastName,
            role,
            userId: firebaseUser.uid,
          };

          if (role === 'patient') {
            try {
              const raw = localStorage.getItem('tc_health_profile_v1');
              if (raw) {
                const profile = JSON.parse(raw);
                const patientId = generatePatientId(user);
                if (patientId) {
                  await savePatientProfile({ ...profile, patientId, email: firebaseUser.email }, token);
                }
              }
            } catch (_) {}
          } else if (role === 'provider') {
            try {
              const raw = localStorage.getItem('tc_provider_profile_v1');
              if (raw) {
                const profile = JSON.parse(raw);
                const providerId = generateProviderId(user);
                if (providerId) {
                  await saveProviderProfile({ ...profile, providerId, email: firebaseUser.email }, token);
                }
              }
            } catch (_) {}
          }
        }
      } catch (_) {
        // sync failure is non-fatal
      }

      localStorage.removeItem('pending_role_v1');
      localStorage.removeItem('pending_signup_v1');
      navigate(postLoginPath, { replace: true });
    });

    // Cleanup on unmount (in case the component is torn down before the callback fires)
    return () => unsubscribe();
  }, [navigate, signIn]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}
