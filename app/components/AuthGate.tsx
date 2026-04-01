"use client";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0E1117] to-[#1C2128] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#238636] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#7C8B9A]">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the main app
  if (user) {
    return <>{children}</>;
  }

  // Show authentication form for unauthenticated users
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await signUp(email, password);
        setSuccess('Account created successfully! Please check your email to verify your account.');
      } else {
        await signIn(email, password);
        // User will be automatically redirected when auth state changes
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E1117] to-[#1C2128] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Nifty<span className="text-[#238636]">Pulse</span>
          </h1>
          <p className="text-[#7C8B9A]">NSE Stock Analysis powered by AI</p>
        </div>

        {/* Auth Form */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-6 shadow-xl">
          <div className="flex mb-6">
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md transition-colors ${
                mode === 'signin'
                  ? 'bg-[#238636] text-white'
                  : 'bg-[#21262D] text-[#7C8B9A] hover:bg-[#30363D]'
              }`}
              onClick={() => {
                setMode('signin');
                setError('');
                setSuccess('');
              }}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md transition-colors ${
                mode === 'signup'
                  ? 'bg-[#238636] text-white'
                  : 'bg-[#21262D] text-[#7C8B9A] hover:bg-[#30363D]'
              }`}
              onClick={() => {
                setMode('signup');
                setError('');
                setSuccess('');
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#C9D1D9] mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-md text-white placeholder-[#7C8B9A] focus:outline-none focus:ring-2 focus:ring-[#238636] focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#C9D1D9] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-md text-white placeholder-[#7C8B9A] focus:outline-none focus:ring-2 focus:ring-[#238636] focus:border-transparent"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-[#C9D1D9] mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-md text-white placeholder-[#7C8B9A] focus:outline-none focus:ring-2 focus:ring-[#238636] focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-[#DA3633]/10 border border-[#DA3633]/20 rounded-md">
                <p className="text-sm text-[#FF7B72]">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-[#238636]/10 border border-[#238636]/20 rounded-md">
                <p className="text-sm text-[#7EE787]">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#238636] hover:bg-[#2EA043] disabled:bg-[#21262D] disabled:text-[#7C8B9A] text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#238636] focus:ring-offset-2 focus:ring-offset-[#161B22]"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{mode === 'signin' ? 'Signing In...' : 'Signing Up...'}</span>
                </div>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#7C8B9A]">
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError('');
                  setSuccess('');
                }}
                className="text-[#58A6FF] hover:text-[#79C0FF] underline"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Demo Note */}
        <div className="mt-6 p-4 bg-[#FFF8C5]/10 border border-[#D4A72C]/20 rounded-lg">
          <p className="text-sm text-[#F7CC4B] text-center">
            <strong>Demo:</strong> Create any account to access the full stock analysis platform
          </p>
        </div>
      </div>
    </div>
  );
}