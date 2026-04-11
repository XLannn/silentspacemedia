import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  contactDetails,
  logoUrl,
  navItems,
  siteName,
  socialLinks,
} from '../data/siteContent'

function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f5f1ea] text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f5f1ea]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5 sm:px-8 lg:px-10">
          <Link
            className="flex items-center gap-4"
            to="/"
            onClick={() => setMenuOpen(false)}
          >
            <img
              alt={siteName}
              className="h-10 w-auto sm:h-12"
              src={logoUrl}
            />
            <div>
              <p className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                {siteName}
              </p>
              <p className="text-xs uppercase tracking-[0.35em] text-stone-500">
               
              </p>
            </div>
          </Link>

          <button
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex rounded-full border border-stone-300 p-2 text-stone-900 lg:hidden"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav
            className={`${
              menuOpen ? 'flex' : 'hidden'
            } absolute left-5 right-5 top-full flex-col gap-3 rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:static lg:flex lg:flex-row lg:items-center lg:gap-8 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  `text-base transition ${
                    isActive
                      ? 'font-semibold text-stone-950'
                      : 'text-stone-600 hover:text-stone-950'
                  }`
                }
                onClick={() => setMenuOpen(false)}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-10">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <img alt={siteName} className="h-10 w-auto" src={logoUrl} />
              <div>
                <p className="font-heading text-2xl font-bold">{siteName}</p>
                <p className="text-sm text-stone-500">
                  Visual storytelling for brands, campaigns, and creators.
                </p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-7 text-stone-600">
              Visual work across campaigns, education, and brand storytelling,
              presented in a clean, fast portfolio experience.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold">Explore</h2>
            <div className="grid gap-3 text-sm text-stone-600">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  className="transition hover:text-stone-950"
                  to={item.to}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold">Contact</h2>
            <div className="grid gap-3 text-sm text-stone-600">
              <a className="transition hover:text-stone-950" href={contactDetails.phoneHref}>
                {contactDetails.phoneDisplay}
              </a>
              <a
                className="transition hover:text-stone-950"
                href={`mailto:${contactDetails.email}`}
              >
                {contactDetails.email}
              </a>
              <p>{contactDetails.addressLines.join(', ')}</p>
              <div className="flex flex-wrap gap-3 pt-2">
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
          </div>
        </div>
      </footer>
    </div>
  )
}

export default SiteLayout
