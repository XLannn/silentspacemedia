import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

function AdminResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function initializeRecoverySession() {
      if (!isSupabaseConfigured || !supabase) {
        if (active) {
          setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
          setIsReady(false)
        }
        return
      }

      try {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            if (active) {
              setError('Invalid or expired reset link. Please request a new one.')
              setIsReady(false)
            }
            return
          }

          window.history.replaceState(null, '', window.location.pathname)
        }

        const { data } = await supabase.auth.getSession()
        if (!active) {
          return
        }

        if (!data.session) {
          setError('Invalid or expired reset link. Please request a new one.')
          setIsReady(false)
          return
        }

        setIsReady(true)
      } catch {
        if (active) {
          setError('Could not validate reset link. Please request a new one.')
          setIsReady(false)
        }
      }
    }

    void initializeRecoverySession()

    return () => {
      active = false
    }
  }, [])

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !isReady) {
      setError('Reset session is not ready. Please request a new link.')
      setMessage('')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      setMessage('')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.')
      setMessage('')
      return
    }

    setIsSubmitting(true)
    setError('')
    setMessage('')

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message)
        setIsSubmitting(false)
        return
      }

      setNewPassword('')
      setConfirmPassword('')
      setShowNewPassword(false)
      setShowConfirmPassword(false)
      setMessage('Password updated successfully. You can now login from the admin page.')
    } catch {
      setError('Could not reset password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1020] text-white">
      <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-[2rem] border border-white/20 bg-white/10 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Admin</p>
          <h1 className="font-heading mt-4 text-3xl font-bold">Set New Password</h1>
          <p className="mt-3 text-sm text-slate-200">
            Enter your new password and confirm it.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleResetPassword}>
            <label className="block space-y-2 text-sm">
              <span>New Password</span>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 pr-12 outline-none ring-cyan-300/70 transition focus:ring-2"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  disabled={!isReady}
                />
                <button
                  className="absolute right-5 top-1/2 z-10 inline-flex h-10 w-5 -translate-y-1/2 items-center justify-center text-slate-300 transition hover:text-white focus:outline-none"
                  type="button"
                  onClick={() => setShowNewPassword((value) => !value)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="block space-y-2 text-sm">
              <span>Confirm Password</span>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 pr-12 outline-none ring-cyan-300/70 transition focus:ring-2"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  disabled={!isReady}
                />
                <button
                  className="absolute right-5 top-1/2 z-10 inline-flex h-10 w-5 -translate-y-1/2 items-center justify-center text-slate-300 transition hover:text-white focus:outline-none"
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>

            {error ? (
              <p className="rounded-xl border border-red-300/50 bg-red-500/20 px-3 py-2 text-sm text-red-100">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100">
                {message}
              </p>
            ) : null}

            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:opacity-70"
              type="submit"
              disabled={isSubmitting || !isReady}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>{isSubmitting ? 'Updating...' : 'Reset password'}</span>
            </button>
          </form>

          <div className="mt-5 text-right">
            <Link className="text-sm text-cyan-200 transition hover:text-cyan-100" to="/admin">
              Back to admin login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminResetPasswordPage
