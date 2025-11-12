import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './services/firebase';
import { User } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Spinner from './components/Spinner';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';

type AuthView = 'login' | 'signup' | 'forgotPassword';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<AuthView>('login');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const renderAuth = () => {
    switch (authView) {
      case 'signup':
        return <SignUp onNavigateToLogin={() => setAuthView('login')} />;
      case 'forgotPassword':
        return <ForgotPassword onNavigateToLogin={() => setAuthView('login')} />;
      case 'login':
      default:
        return <Login onNavigateToSignUp={() => setAuthView('signup')} onNavigateToForgotPassword={() => setAuthView('forgotPassword')} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {user ? <Dashboard user={user} /> : renderAuth()}
    </div>
  );
};

export default App;
