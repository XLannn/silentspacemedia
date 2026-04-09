import ContactForm from '../components/ContactForm'
import { contactDetails, socialLinks } from '../data/siteContent'

function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[2rem] bg-white px-6 py-10 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:px-10">
          <p className="text-sm uppercase tracking-[0.35em] text-stone-500">
            Contact
          </p>
          <h1 className="font-heading mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Let’s talk.
          </h1>
          <div className="mt-8 space-y-5 text-sm leading-7 text-stone-600 sm:text-base">
            <p>
              <a className="hover:text-stone-950" href={contactDetails.phoneHref}>
                {contactDetails.phoneDisplay}
              </a>
            </p>
            <p>
              <a
                className="hover:text-stone-950"
                href={`mailto:${contactDetails.email}`}
              >
                {contactDetails.email}
              </a>
            </p>
            <div>
              {contactDetails.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition hover:border-stone-950 hover:text-stone-950"
                href={item.href}
                rel="noreferrer"
                target="_blank"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <ContactForm buttonLabel="Submit" compact />
      </section>
    </div>
  )
}

export default ContactPage
