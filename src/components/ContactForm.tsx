import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { submitContactInquiry } from '../lib/inquiries'

type ContactFormProps = {
  buttonLabel?: string
  compact?: boolean
}

const inputClasses =
  'w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-900'

function ContactForm({
  buttonLabel = 'Contact us',
  compact = false,
}: ContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSubmitError('')
    setSubmitMessage('')

    if (!name.trim() || !email.trim() || !message.trim()) {
      setSubmitError('Please fill name, email, and message.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitContactInquiry({ name, email, message })

      if (result.error) {
        setSubmitError(result.error)
        setIsSubmitting(false)
        return
      }

      setName('')
      setEmail('')
      setMessage('')
      setSubmitMessage('Thank you. Your inquiry was submitted successfully.')
    } catch {
      setSubmitError('Could not submit your inquiry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="space-y-4 rounded-[2rem] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className={compact ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2'}>
        <label className="space-y-2 text-sm font-medium text-stone-700">
          <span>Name</span>
          <input
            className={inputClasses}
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-stone-700">
          <span>Email</span>
          <input
            className={inputClasses}
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
      </div>
      <label className="block space-y-2 text-sm font-medium text-stone-700">
        <span>Message</span>
        <textarea
          className={`${inputClasses} min-h-36 resize-y`}
          name="message"
          rows={compact ? 5 : 7}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
        />
      </label>
      {submitError ? (
        <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}
      {submitMessage ? (
        <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {submitMessage}
        </p>
      ) : null}
      <button
        className="inline-flex items-center justify-center rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <span className={isSubmitting ? 'ml-2' : ''}>
          {isSubmitting ? 'Submitting...' : buttonLabel}
        </span>
      </button>
    </form>
  )
}

export default ContactForm
