import { aboutImageUrl, socialLinks } from '../data/siteContent'

function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <img
          alt="silentspacemedia about page visual"
          className="h-[34rem] w-full object-cover object-top sm:h-[48rem]"
          src={aboutImageUrl}
        />
      </div>

      <section className="mx-auto mt-8 max-w-4xl rounded-[2rem] bg-white px-6 py-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:px-10">
        <p className="text-sm uppercase tracking-[0.35em] text-stone-500">
          About
        </p>
        <h1 className="font-heading mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Quiet visuals. Strong recall.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
          This section keeps a minimal tone: one strong hero visual and direct
          social links for anyone who wants to follow the studio.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {socialLinks.map((item) => (
            <a
              key={item.label}
              className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold transition hover:border-stone-950 hover:bg-stone-950 hover:text-white"
              href={item.href}
              rel="noreferrer"
              target="_blank"
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AboutPage
