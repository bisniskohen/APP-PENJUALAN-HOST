
import React, { useState } from 'react';
// FIX: Use v8-compatible auth method
// import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';

interface ForgotPasswordProps {
  onNavigateToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigateToLogin }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      // FIX: Use auth.sendPasswordResetEmail (v8 compat) instead of sendPasswordResetEmail(auth,...) (v9 modular)
      await auth.sendPasswordResetEmail(email);
      setMessage('Email pengaturan ulang kata sandi telah dikirim. Silakan periksa kotak masuk Anda.');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('Tidak ada pengguna yang ditemukan dengan email ini.');
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
          <h2 className="text-3xl font-extrabold text-white">Lupa Password</h2>
          <p className="mt-2 text-sm text-slate-400">Masukkan email Anda untuk menerima link reset</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          {error && <p className="text-red-500 text-sm text-center bg-red-900/20 p-3 rounded-lg">{error}</p>}
          {message && <p className="text-green-500 text-sm text-center bg-green-900/20 p-3 rounded-lg">{message}</p>}
          
          <div className="rounded-md shadow-sm">
            <label htmlFor="email-address-reset" className="sr-only">Alamat Email</label>
            <input id="email-address-reset" name="email" type="email" autoComplete="email" required
              className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-700 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Alamat Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <button type="submit" disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed">
              {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>
          </div>
          <div className="text-sm text-center">
            <button type="button" onClick={onNavigateToLogin} className="font-medium text-indigo-400 hover:text-indigo-300">
              Kembali ke Halaman Masuk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;