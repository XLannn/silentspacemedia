import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPortfolioData, seedPortfolioData } from '../lib/portfolio'
import type { PortfolioCategory, PortfolioImageLayout } from '../types/portfolio'

type LightboxState = {
  categoryId: string
  imageIndex: number
}

const portfolioImageLayoutClassMap: Record<PortfolioImageLayout, string> = {
  small: 'col-span-1 row-span-1',
  wide: 'col-span-2 row-span-1 xl:col-span-2',
  tall: 'col-span-1 row-span-2',
  'feature-left': 'col-span-2 row-span-2 xl:col-span-2 xl:row-span-2 xl:col-start-1',
  'feature-right':
    'col-span-2 row-span-2 xl:col-span-2 xl:row-span-2 xl:col-start-2',
  full: 'col-span-2 row-span-2 xl:col-span-3 xl:row-span-2',
}

function getPortfolioImageLayoutClass(layout?: PortfolioImageLayout): string {
  if (!layout) {
    return portfolioImageLayoutClassMap.small
  }

  return portfolioImageLayoutClassMap[layout] ?? portfolioImageLayoutClassMap.small
}

function PortfolioPage() {
  const [categories, setCategories] = useState<PortfolioCategory[]>(
    seedPortfolioData.categories,
  )
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

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

  const activeCategory = lightbox
    ? categories.find((category) => category.id === lightbox.categoryId) ?? null
    : null
  const activeImage =
    activeCategory && lightbox
      ? activeCategory.images[lightbox.imageIndex] ?? null
      : null

  function openLightbox(categoryId: string, imageIndex: number) {
    setLightbox({ categoryId, imageIndex })
  }

  function closeLightbox() {
    setLightbox(null)
  }

  function moveLightbox(direction: 1 | -1) {
    setLightbox((current) => {
      if (!current) {
        return current
      }

      const currentCategory = categories.find(
        (category) => category.id === current.categoryId,
      )
      if (!currentCategory || currentCategory.images.length === 0) {
        return current
      }

      const count = currentCategory.images.length
      const nextIndex = (current.imageIndex + direction + count) % count

      return { ...current, imageIndex: nextIndex }
    })
  }

  useEffect(() => {
    if (!lightbox) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeLightbox()
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        moveLightbox(1)
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        moveLightbox(-1)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [lightbox, categories])

  useEffect(() => {
    if (!lightbox) {
      return
    }

    const category = categories.find((item) => item.id === lightbox.categoryId)
    if (!category || category.images.length === 0) {
      setLightbox(null)
      return
    }

    if (lightbox.imageIndex >= category.images.length) {
      setLightbox({ categoryId: lightbox.categoryId, imageIndex: 0 })
    }
  }, [categories, lightbox])

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
            <div className="mt-6 grid auto-rows-[200px] grid-cols-2 grid-flow-dense gap-4 xl:auto-rows-[220px] xl:grid-cols-3">
              {section.images.map((image, index) => (
                <button
                  key={image.id}
                  className={`overflow-hidden rounded-[1.5rem] bg-[#f5f1ea] p-0.5 text-left ${getPortfolioImageLayoutClass(
                    image.layout,
                  )}`}
                  onClick={() => openLightbox(section.id, index)}
                  type="button"
                  aria-label={`Open ${section.title} sample ${index + 1}`}
                >
                  <img
                    alt={`${section.title} work sample ${index + 1}`}
                    className="h-full w-full rounded-[1.2rem] object-contain transition duration-500 hover:scale-[1.02]"
                    src={image.url}
                  />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {lightbox && activeCategory && activeImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${activeCategory.title} image viewer`}
          onClick={closeLightbox}
        >
          <button
            className="absolute right-5 top-5 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
            type="button"
            onClick={closeLightbox}
            aria-label="Close image viewer"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              moveLightbox(-1)
            }}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              moveLightbox(1)
            }}
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div
            className="max-h-[90vh] w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              alt={`${activeCategory.title} enlarged view`}
              className="max-h-[82vh] w-full rounded-2xl object-contain"
              src={activeImage.url}
            />
            <p className="mt-3 text-center text-sm text-white/85">
              {activeCategory.title} - {lightbox.imageIndex + 1}/{activeCategory.images.length}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default PortfolioPage
