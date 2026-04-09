import type { FormEvent } from 'react'

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
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <form
      className="space-y-4 rounded-[2rem] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className={compact ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2'}>
        <label className="space-y-2 text-sm font-medium text-stone-700">
          <span>Name</span>
          <input className={inputClasses} name="name" type="text" />
        </label>
        <label className="space-y-2 text-sm font-medium text-stone-700">
          <span>Email</span>
          <input className={inputClasses} name="email" type="email" required />
        </label>
      </div>
      <label className="block space-y-2 text-sm font-medium text-stone-700">
        <span>Message</span>
        <textarea
          className={`${inputClasses} min-h-36 resize-y`}
          name="message"
          rows={compact ? 5 : 7}
        />
      </label>
      <button
        className="inline-flex items-center justify-center rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
        type="submit"
      >
        {buttonLabel}
      </button>
    </form>
  )
}

export default ContactForm
