import { useEffect, useState } from 'react'
import { getPortfolioData, seedPortfolioData } from '../lib/portfolio'
import type { PortfolioCategory } from '../types/portfolio'

function PortfolioPage() {
  const [categories, setCategories] = useState<PortfolioCategory[]>(
    seedPortfolioData.categories,
  )

  useEffect(() => {
    let cancelled = false

    async function loadPortfolio() {
      const portfolioData = await getPortfolioData()

      if (!cancelled && portfolioData.categories.length > 0) {
        setCategories(portfolioData.categories)
      }
    }

    void loadPortfolio()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <section className="rounded-[2rem] bg-white px-6 py-10 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:px-10">
        <p className="text-sm uppercase tracking-[0.35em] text-stone-500">
          Portfolio
        </p>
        <h1 className="font-heading mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Selected Work
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
          Work is grouped by project type so visitors can browse campaign,
          education, brand, poster, and brochure pieces in a clear responsive
          gallery.
        </p>
      </section>

      <div className="mt-8 space-y-8">
        {categories.map((section) => (
          <section
            key={section.id}
            className="rounded-[2rem] bg-white px-6 py-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:px-8"
          >
            <h2 className="font-heading text-3xl font-bold tracking-tight">
              {section.title}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {section.images.map((image, index) => (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-[1.5rem] bg-[#f5f1ea]"
                >
                  <img
                    alt={`${section.title} work sample ${index + 1}`}
                    className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
                    src={image.url}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default PortfolioPage
