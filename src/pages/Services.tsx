import { Link } from 'react-router-dom'
import { servicesImageUrl } from '../data/siteContent'

const servicePillars = [
  {
    title: 'Watch',
    description: 'Campaign visuals, posters, reels, and image-led storytelling.',
  },
  {
    title: 'Read',
    description: 'Brand profiles, brochures, and polished promotional layouts.',
  },
  {
    title: 'Listen',
    description: 'Messaging shaped around tone, emotion, and audience recall.',
  },
]

function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <section className="rounded-[2rem] bg-white px-6 py-10 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:px-10">
        <p className="text-sm uppercase tracking-[0.35em] text-stone-500">
          Services
        </p>
        <h1 className="font-heading mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Our Services
        </h1>
        <div className="mt-8 overflow-hidden rounded-[1.75rem] bg-[#d3ab90]">
          <img
            alt="silentspacemedia services visual"
            className="h-[28rem] w-full object-cover sm:h-[40rem]"
            src={servicesImageUrl}
          />
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            The live site keeps this page focused on a single visual and a few
            clear message blocks. This version follows that structure while
            giving each section a little more breathing room.
          </p>
          <Link
            className="inline-flex rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
            to="/contact"
          >
            Contact Us
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] bg-stone-950 px-6 py-10 text-white sm:px-10">
          <p className="text-sm uppercase tracking-[0.35em] text-stone-300">
            Testimonial
          </p>
          <h2 className="font-heading mt-5 text-3xl font-bold sm:text-4xl">
            “Thank you for trusting us to tell your story.”
          </h2>
          <p className="mt-8 text-lg font-semibold">Nevin Sam</p>
          <p className="text-sm uppercase tracking-[0.25em] text-stone-400">
            CEO, silentspacemedia
          </p>
        </div>

        <div className="rounded-[2rem] bg-[#efe4dc] px-6 py-10 sm:px-10">
          <p className="text-sm uppercase tracking-[0.35em] text-stone-500">
            Watch, Read, Listen
          </p>
          <div className="mt-6 grid gap-5">
            {servicePillars.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
              >
                <h3 className="font-heading text-2xl font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] bg-[#d7c3b1] px-6 py-10 sm:px-10">
        <p className="text-sm uppercase tracking-[0.35em] text-stone-600">
          Join 900+ subscribers
        </p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              Stay in the loop with everything you need to know.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-700">
              Stay connected for updates, launches, and new creative work from
              silentspacemedia.
            </p>
          </div>
          <form className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
            <input
              className="min-h-12 flex-1 rounded-full border border-stone-400/50 bg-white px-5 text-sm outline-none transition focus:border-stone-900"
              placeholder="Enter your email"
              type="email"
            />
            <button
              className="rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              type="button"
            >
              Sign up
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default ServicesPage
