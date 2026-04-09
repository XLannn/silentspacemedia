import ContactForm from '../components/ContactForm'
import {
  contactDetails,
  heroImageUrl,
  homeCtaImageUrl,
  logoUrl,
} from '../data/siteContent'

function HomePage() {
  return (
    <div className="pb-16">
      <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-[2rem] bg-[#e9d9cf]">
          <img
            alt="silentspacemedia featured home visual"
            className="h-[28rem] w-full object-cover object-top sm:h-[38rem]"
            src={heroImageUrl}
          />
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="rounded-[2rem] bg-[#efe4dc] px-6 py-12 text-center sm:px-10">
          <img
            alt="silentspacemedia logo"
            className="mx-auto h-20 w-auto sm:h-24"
            src={logoUrl}
          />
          <p className="mt-6 text-sm uppercase tracking-[0.35em] text-stone-500">
            Creative direction, design, and digital storytelling
          </p>
          <h1 className="font-heading mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Stories shaped with clarity, warmth, and impact.
          </h1>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div className="rounded-[2rem] bg-stone-950 px-6 py-8 text-white sm:px-8">
          <p className="text-sm uppercase tracking-[0.35em] text-stone-300">
            Contact
          </p>
          <h2 className="font-heading mt-4 text-3xl font-bold sm:text-4xl">
            Start the next piece of your brand story.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-stone-300">
            silentspacemedia keeps the home page simple on purpose: a strong visual
            first impression, then a direct line for conversation.
          </p>
          <div className="mt-8 space-y-3 text-sm text-stone-200">
            <a className="block hover:text-white" href={contactDetails.phoneHref}>
              {contactDetails.phoneDisplay}
            </a>
            <a
              className="block hover:text-white"
              href={`mailto:${contactDetails.email}`}
            >
              {contactDetails.email}
            </a>
            <p>{contactDetails.addressLines.join(', ')}</p>
          </div>
        </div>

        <ContactForm />
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-5 sm:px-8 lg:px-10">
        <a
          className="group block overflow-hidden rounded-[2rem]"
          rel="noreferrer"
          target="_blank"
          href="https://wa.me/+919947361083"
        >
          <div className="relative">
            <img
              alt="silentspacemedia contact visual"
              className="h-[28rem] w-full object-cover object-top transition duration-500 group-hover:scale-[1.02] sm:h-[40rem]"
              src={homeCtaImageUrl}
            />
            <div className="absolute inset-x-5 bottom-5 rounded-[1.5rem] bg-white/88 p-5 backdrop-blur sm:inset-x-auto sm:right-6 sm:w-[24rem]">
              <p className="text-xs uppercase tracking-[0.35em] text-stone-500">
                WhatsApp
              </p>
              <h2 className="font-heading mt-2 text-2xl font-bold">
                Reach out instantly
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Tap through to continue the conversation on WhatsApp and start
                your project conversation instantly.
              </p>
            </div>
          </div>
        </a>
      </section>
    </div>
  )
}

export default HomePage
