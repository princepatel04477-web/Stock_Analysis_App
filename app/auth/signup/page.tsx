"use client";
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match')
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long')
    }

    try {
      setError('')
      setMessage('')
      setLoading(true)
      
      const { user } = await signUp(email, password)
      
      if (user && !user.email_confirmed_at) {
        setMessage('Please check your email to verify your account before signing in.')
      } else {
        router.push('/') // Redirect if email confirmation not required
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#F0F6FC] mb-2">Create Account</h1>
          <p className="text-[#8B949E]">Join NiftyPulse to track your investments</p>
        </div>

        {/* Signup Form */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#F85149]/10 border border-[#F85149]/20 rounded-lg p-3 text-[#F85149] text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-[#238636]/10 border border-[#238636]/20 rounded-lg p-3 text-[#238636] text-sm">
                {message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#F0F6FC] mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-lg text-[#F0F6FC] placeholder-[#8B949E] focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF] focus:outline-none"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#F0F6FC] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-lg text-[#F0F6FC] placeholder-[#8B949E] focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF] focus:outline-none"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-[#8B949E] mt-1">Must be at least 6 characters long</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#F0F6FC] mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="w-full px-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-lg text-[#F0F6FC] placeholder-[#8B949E] focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF] focus:outline-none"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#238636] hover:bg-[#2EA043] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#8B949E] text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#58A6FF] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-[#8B949E] hover:text-[#F0F6FC] text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}