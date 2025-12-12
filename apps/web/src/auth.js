/**
 * Auth disabled - simple stub to prevent import errors
 */

// Mock auth exports - auth system not configured
export const auth = () => null;
export const signIn = () => Promise.resolve({ ok: false, error: 'Auth not configured' });
export const signOut = () => Promise.resolve({ ok: true });
