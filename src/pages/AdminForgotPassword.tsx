import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSendReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      setMessage('')
      return
    }

    setIsSending(true)
    setError('')
    setMessage('')

    try {
      const redirectTo = `${window.location.origin}/admin/reset-password`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo },
      )

      if (resetError) {
        setError(resetError.message)
        setIsSending(false)
        return
      }

      setMessage(
        'If this email is registered, a reset link has been sent. Please check your inbox.',
      )
    } catch {
      setError('Could not send reset link. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1020] text-white">
      <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-[2rem] border border-white/20 bg-white/10 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Admin</p>
          <h1 className="font-heading mt-4 text-3xl font-bold">Reset Password</h1>
          <p className="mt-3 text-sm text-slate-200">
            Enter your registered email and we will send a password reset link.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSendReset}>
            <label className="block space-y-2 text-sm">
              <span>Email</span>
              <input
                className="w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 outline-none ring-cyan-300/70 transition focus:ring-2"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                required
              />
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
              disabled={isSending}
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>{isSending ? 'Sending...' : 'Send reset link'}</span>
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

export default AdminForgotPasswordPage
