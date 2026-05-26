import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/UI/Input'
import { Button } from '@/components/UI/Button'
import { Spinner } from '@/components/UI/Spinner'

export default function Login() {
  const { session, signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  if (session) return <Navigate to="/" replace />

  const onSubmit = async ({ email, password }) => {
    setServerError('')
    setSuccess('')
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setServerError(error.message)
    } else {
      const { error } = await signUp(email, password)
      if (error) setServerError(error.message)
      else setSuccess('Account created! Check your email to confirm before signing in.')
    }
  }

  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center bg-brand-dark px-4">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orange text-white text-xl font-extrabold shadow-lg shadow-brand-orange/20">
          JV
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">JV StackBuild</h1>
          <p className="text-sm text-gray-500 mt-1">Construction Takeoff & Estimating</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-surface p-8 shadow-2xl">
        <h2 className="mb-6 text-center text-base font-semibold text-white">
          {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
            })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
            })}
          />

          {serverError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {serverError}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {success}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setServerError(''); setSuccess('') }}
            className="font-medium text-brand-orange hover:underline"
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>

      <p className="mt-6 text-xs text-gray-600">
        © {new Date().getFullYear()} JV General Contractors. All rights reserved.
      </p>
    </div>
  )
}
