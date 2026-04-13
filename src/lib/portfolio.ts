import portfolioSeed from '../data/portfolioSeed.json'
import { isSupabaseConfigured, portfolioTable, supabase } from './supabase'
import { PORTFOLIO_IMAGE_LAYOUTS } from '../types/portfolio'
import type {
  PortfolioImageLayout,
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
    layout: 'small',
  }
}

const portfolioImageLayoutSet = new Set<PortfolioImageLayout>(PORTFOLIO_IMAGE_LAYOUTS)

function normalizePortfolioImageLayout(value: unknown): PortfolioImageLayout {
  if (typeof value === 'string' && portfolioImageLayoutSet.has(value as PortfolioImageLayout)) {
    return value as PortfolioImageLayout
  }

  return 'small'
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

const portfolioRowId = 'primary'

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
                layout?: unknown
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
                layout: normalizePortfolioImageLayout(imageRecord.layout),
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
  if (!isSupabaseConfigured || !supabase) {
    return seedPortfolioData
  }

  try {
    const { data, error } = await supabase
      .from(portfolioTable)
      .select('data')
      .eq('id', portfolioRowId)
      .maybeSingle()

    if (error) {
      throw error
    }

    const normalized = normalizePortfolioData(data?.data)

    if (normalized && normalized.categories.length > 0) {
      return normalized
    }
  } catch {
    // Ignore and fallback to local seed.
  }

  return seedPortfolioData
}

export async function savePortfolioData(categories: PortfolioCategory[]) {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' }
  }

  const payload: PortfolioData = {
    version: 1,
    updatedAt: new Date().toISOString(),
    categories,
  }

  const { data, error } = await supabase
    .from(portfolioTable)
    .upsert(
      {
        id: portfolioRowId,
        data: payload,
        updated_at: payload.updatedAt,
      },
      { onConflict: 'id' },
    )
    .select('data')
    .single()

  if (error) {
    return { error: error.message }
  }

  const normalized = normalizePortfolioData(data?.data)
  return { data: normalized ?? payload }
}
