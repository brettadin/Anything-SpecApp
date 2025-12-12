import { useCallback } from 'react';
// Auth removed - mock functions
// import { signIn, signOut } from "@auth/create/react";

const signIn = (provider, options) => {
  console.warn('Auth not implemented - signIn called with', provider);
  return Promise.resolve({ ok: false, error: 'Auth not configured' });
};

const signOut = (options) => {
  console.warn('Auth not implemented - signOut called');
  return Promise.resolve();
};

function useAuth() {
  const callbackUrl = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('callbackUrl')
    : null;

  const signInWithCredentials = useCallback((options) => {
    return signIn("credentials-signin", {
      ...options,
      callbackUrl: callbackUrl ?? options.callbackUrl
    });
  }, [callbackUrl])

  const signUpWithCredentials = useCallback((options) => {
    return signIn("credentials-signup", {
      ...options,
      callbackUrl: callbackUrl ?? options.callbackUrl
    });
  }, [callbackUrl])

  const signInWithGoogle = useCallback((options) => {
    return signIn("google", {
      ...options,
      callbackUrl: callbackUrl ?? options.callbackUrl
    });
  }, [callbackUrl]);
  const signInWithFacebook = useCallback((options) => {
    return signIn("facebook", options);
  }, []);
  const signInWithTwitter = useCallback((options) => {
    return signIn("twitter", options);
  }, []);

  return {
    signInWithCredentials,
    signUpWithCredentials,
    signInWithGoogle,
    signInWithFacebook,
    signInWithTwitter,
    signOut,
  }
}

export default useAuth;