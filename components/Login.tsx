
import React, { useState } from 'react';
// FIX: Use v8-compatible auth method, so signInWithEmailAndPassword is not needed from firebase/auth.
// import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

interface LoginProps {
  onNavigateToSignUp: () => void;
  onNavigateToForgotPassword: () => void;
}


const Login: React.FC<LoginProps> = ({ onNavigateToSignUp, onNavigateToForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    if (!email || !password) {
      setError("Email dan password harus diisi.");
      setIsLoading(false);
      return;
    }
    try {
      // FIX: Use auth.signInWithEmailAndPassword (v8 compat) instead of signInWithEmailAndPassword(auth,...) (v9 modular)
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Email atau password salah.');
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
          <h2 className="text-3xl font-extrabold text-white">PT BMS</h2>
          <p className="mt-2 text-sm text-slate-400">Masuk untuk mengakses dasbor Anda</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && <p className="text-red-500 text-sm text-center bg-red-900/20 p-3 rounded-lg">{error}</p>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Alamat Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-700 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm rounded-t-md"
                placeholder="Alamat Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-700 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm rounded-b-md"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end">
            <div className="text-sm">
              <button type="button" onClick={onNavigateToForgotPassword} className="font-medium text-indigo-400 hover:text-indigo-300">
                Lupa password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
          <div className="text-sm text-center">
              <button type="button" onClick={onNavigateToSignUp} className="font-medium text-indigo-400 hover:text-indigo-300">
                Belum punya akun? Daftar
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
