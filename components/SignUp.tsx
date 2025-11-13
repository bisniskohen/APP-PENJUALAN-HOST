
import React, { useState } from 'react';
// FIX: Use v8-compatible auth method
// import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

interface SignUpProps {
  onNavigateToLogin: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onNavigateToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Password tidak cocok.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal harus 6 karakter.");
      return;
    }
    setIsLoading(true);
    try {
      // FIX: Use auth.createUserWithEmailAndPassword (v8 compat) instead of createUserWithEmailAndPassword(auth,...) (v9 modular)
      await auth.createUserWithEmailAndPassword(email, password);
      // User will be automatically logged in and redirected by the onAuthStateChanged listener in App.tsx
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email sudah terdaftar. Silakan masuk.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-900 rounded-2xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white">Buat Akun Baru</h2>
          <p className="mt-2 text-sm text-slate-400">Daftar untuk memulai</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          {error && <p className="text-red-500 text-sm text-center bg-red-900/20 p-3 rounded-lg">{error}</p>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address-signup" className="sr-only">Alamat Email</label>
              <input id="email-address-signup" name="email" type="email" autoComplete="email" required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-700 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm rounded-t-md"
                placeholder="Alamat Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password-signup" className="sr-only">Password</label>
              <input id="password-signup" name="password" type="password" autoComplete="new-password" required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-700 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label htmlFor="confirm-password-signup" className="sr-only">Konfirmasi Password</label>
              <input id="confirm-password-signup" name="confirm-password" type="password" autoComplete="new-password" required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-700 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm rounded-b-md"
                placeholder="Konfirmasi Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <div>
            <button type="submit" disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed">
              {isLoading ? 'Mendaftar...' : 'Daftar'}
            </button>
          </div>
          <div className="text-sm text-center">
            <button type="button" onClick={onNavigateToLogin} className="font-medium text-indigo-400 hover:text-indigo-300">
              Sudah punya akun? Masuk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;