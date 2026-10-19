import React, { useEffect, useState } from 'react';
import { auth, prepareFirebaseGoogleSignIn, signInWithGoogle } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Optional account entry. Local access stays available until the cloud account
 * has been restored, so signing in never requires deleting existing stories.
 * Face ID is intentionally not presented as functional until a verified
 * WebAuthn server is configured and linked to the same Firebase UID.
 */
export function CloudLoginScreen({ onContinueLocal }: { onContinueLocal: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    void prepareFirebaseGoogleSignIn().catch(() => undefined);
    return onAuthStateChanged(auth, (user) => { if (user) onContinueLocal(); });
  }, [onContinueLocal]);

  const login = async () => {
    setBusy(true);
    setError('');
    try {
      await prepareFirebaseGoogleSignIn();
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: 'radial-gradient(circle at top, #ff1493, #39001f 62%, #090006)', color: '#fff' }}>
      <section style={{ width: 'min(100%, 410px)', padding: 28, borderRadius: 32, border: '1px solid #ffffff77', background: '#ffffff20', backdropFilter: 'blur(24px)', boxShadow: 'inset 0 2px 2px #ffffff80, 0 20px 60px #0008', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Pretty Little Fantasies</h1>
        <p style={{ marginBottom: 24 }}>Where Fiction Gets Personal</p>
        <p style={{ marginBottom: 20 }}>Sign in with your Google account to restore your Firebase stories across devices.</p>
        <button type="button" onClick={login} disabled={busy} style={{ width: '100%', padding: 15, borderRadius: 18, background: '#fff', color: '#270018', fontWeight: 800 }}>
          {busy ? 'Connecting…' : 'Continue with Google'}
        </button>
        <p style={{ marginTop: 16, opacity: .85, fontSize: 13 }}>Face ID passkeys are coming after secure account linking is configured. Your Google login remains available.</p>
        <button type="button" onClick={onContinueLocal} style={{ marginTop: 20, textDecoration: 'underline' }}>Continue on this device without cloud sign-in</button>
        {error && <p role="alert" style={{ color: '#fff', background: '#95002b', padding: 12, borderRadius: 12, marginTop: 18 }}>{error}</p>}
      </section>
    </main>
  );
}
