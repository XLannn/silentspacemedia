import portfolioSeed from '../data/portfolioSeed.json'
import type {
  PortfolioCategory,
  PortfolioData,
  PortfolioImage,
} from '../types/portfolio'

type SeedCategory = {
  title: string
  images: string[]
}

const seed = portfolioSeed as SeedCategory[]

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createSeedImage(categorySlug: string, imageName: string, index: number): PortfolioImage {
  return {
    id: `${categorySlug}-image-${index + 1}`,
    url: `/assets/${imageName}`,
  }
}

export const seedPortfolioCategories: PortfolioCategory[] = seed.map(
  (category, categoryIndex) => {
    const categorySlug = slugify(category.title) || `category-${categoryIndex + 1}`

    return {
      id: `${categorySlug}-${categoryIndex + 1}`,
      title: category.title,
      images: category.images.map((imageName, imageIndex) =>
        createSeedImage(categorySlug, imageName, imageIndex),
      ),
    }
  },
)

export const seedPortfolioData: PortfolioData = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  categories: seedPortfolioCategories,
}

export function normalizePortfolioData(raw: unknown): PortfolioData | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const data = raw as {
    version?: unknown
    updatedAt?: unknown
    categories?: unknown
  }

  if (!Array.isArray(data.categories)) {
    return null
  }

  const categories: PortfolioCategory[] = data.categories
    .map((category, categoryIndex) => {
      if (!category || typeof category !== 'object') {
        return null
      }

      const categoryRecord = category as {
        id?: unknown
        title?: unknown
        images?: unknown
      }

      const title =
        typeof categoryRecord.title === 'string'
          ? categoryRecord.title.trim()
          : ''

      if (!title) {
        return null
      }

      const fallbackSlug = slugify(title) || `category-${categoryIndex + 1}`

      const images: PortfolioImage[] = Array.isArray(categoryRecord.images)
        ? categoryRecord.images
            .map((image, imageIndex) => {
              if (!image || typeof image !== 'object') {
                return null
              }

              const imageRecord = image as {
                id?: unknown
                url?: unknown
                pathname?: unknown
              }

              if (typeof imageRecord.url !== 'string' || !imageRecord.url.trim()) {
                return null
              }

              const normalizedImage: PortfolioImage = {
                id:
                  typeof imageRecord.id === 'string' && imageRecord.id.trim()
                    ? imageRecord.id
                    : `${fallbackSlug}-image-${imageIndex + 1}`,
                url: imageRecord.url,
              }

              if (
                typeof imageRecord.pathname === 'string' &&
                imageRecord.pathname.trim()
              ) {
                normalizedImage.pathname = imageRecord.pathname
              }

              return normalizedImage
            })
            .filter((image): image is PortfolioImage => image !== null)
        : []

      return {
        id:
          typeof categoryRecord.id === 'string' && categoryRecord.id.trim()
            ? categoryRecord.id
            : `${fallbackSlug}-${categoryIndex + 1}`,
        title,
        images,
      }
    })
    .filter((category): category is PortfolioCategory => category !== null)

  return {
    version: typeof data.version === 'number' ? data.version : 1,
    updatedAt:
      typeof data.updatedAt === 'string' && data.updatedAt
        ? data.updatedAt
        : new Date().toISOString(),
    categories,
  }
}

export async function getPortfolioData(): Promise<PortfolioData> {
  try {
    const response = await fetch('/api/portfolio', { cache: 'no-store' })

    if (response.ok) {
      const raw = (await response.json()) as unknown
      const normalized = normalizePortfolioData(raw)

      if (normalized && normalized.categories.length > 0) {
        return normalized
      }
    }
  } catch {
    // Ignore and fallback to local seed.
  }

  return seedPortfolioData
}
