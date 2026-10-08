import { useState, useEffect, type ReactNode } from 'react';
import { isFirebaseConfigured, auth } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';
import { Chrome } from 'lucide-react';

interface AuthGateProps { children: (user: User | null) => ReactNode; }

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, (fu) => { setUser(fu); setLoading(false); });
    return () => unsubscribe();
  }, []);

  const handleGoogle = async () => {
    if (!auth) return;
    setLoading(true); setError(null);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (err: any) {
      setError(err.code === 'auth/popup-blocked' ? 'Pop-up bloqueado.' : err.message || 'Erro ao fazer login.');
    } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#121420] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Verificando autenticacao...</p>
      </div>
    </div>
  );

  if (!isFirebaseConfigured() || !auth) return <>{children(null)}</>;

  if (!user) return (
    <div className="min-h-screen bg-[#121420] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-cyan-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">🎵</div>
          <h1 className="text-2xl font-black text-white tracking-tight">NeonFlow</h1>
          <p className="text-xs text-gray-400">Music Streaming & Family Sharing</p>
        </div>
        <div className="bg-[#1a1c2e] rounded-xl border border-gray-700 p-6 space-y-4">
          {error && <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-xs text-red-400">{error}</div>}
          <button onClick={handleGoogle} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-xl text-sm uppercase tracking-wide transition flex items-center justify-center gap-2 cursor-pointer">
            <Chrome className="w-4 h-4" /> Entrar com Google
          </button>
        </div>
      </div>
    </div>
  );

  return <>{children(user)}</>;
}
