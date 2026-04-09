import { list, put } from '@vercel/blob'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORTFOLIO_JSON_PATH = 'portfolio/portfolio-data.json'

let cachedSeed = null

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizePortfolioData(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.categories)) {
    return null
  }

  const categories = raw.categories
    .map((category, categoryIndex) => {
      if (!category || typeof category !== 'object') {
        return null
      }

      const title = typeof category.title === 'string' ? category.title.trim() : ''
      if (!title) {
        return null
      }

      const fallbackSlug = slugify(title) || `category-${categoryIndex + 1}`

      const images = Array.isArray(category.images)
        ? category.images
            .map((image, imageIndex) => {
              if (!image || typeof image !== 'object' || typeof image.url !== 'string') {
                return null
              }

              return {
                id:
                  typeof image.id === 'string' && image.id.trim()
                    ? image.id
                    : `${fallbackSlug}-image-${imageIndex + 1}`,
                url: image.url,
                pathname:
                  typeof image.pathname === 'string' && image.pathname.trim()
                    ? image.pathname
                    : undefined,
              }
            })
            .filter(Boolean)
        : []

      return {
        id:
          typeof category.id === 'string' && category.id.trim()
            ? category.id
            : `${fallbackSlug}-${categoryIndex + 1}`,
        title,
        images,
      }
    })
    .filter(Boolean)

  return {
    version: typeof raw.version === 'number' ? raw.version : 1,
    updatedAt:
      typeof raw.updatedAt === 'string' && raw.updatedAt
        ? raw.updatedAt
        : new Date().toISOString(),
    categories,
  }
}

async function readSeedData() {
  if (cachedSeed) {
    return cachedSeed
  }

  const directory = path.dirname(fileURLToPath(import.meta.url))
  const seedPath = path.resolve(directory, '../../src/data/portfolioSeed.json')
  const seedContent = await readFile(seedPath, 'utf8')
  const seed = JSON.parse(seedContent)

  const categories = seed.map((category, categoryIndex) => {
    const categorySlug = slugify(category.title) || `category-${categoryIndex + 1}`

    return {
      id: `${categorySlug}-${categoryIndex + 1}`,
      title: category.title,
      images: category.images.map((imageName, imageIndex) => ({
        id: `${categorySlug}-image-${imageIndex + 1}`,
        url: `/assets/${imageName}`,
      })),
    }
  })

  cachedSeed = {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    categories,
  }

  return cachedSeed
}

export async function readPortfolioData() {
  try {
    const blobList = await list({
      prefix: PORTFOLIO_JSON_PATH,
      limit: 10,
    })

    const match =
      blobList.blobs.find((blob) => blob.pathname === PORTFOLIO_JSON_PATH) ?? null

    if (!match) {
      return await readSeedData()
    }

    const response = await fetch(match.url, { cache: 'no-store' })
    if (!response.ok) {
      return await readSeedData()
    }

    const payload = await response.json()
    const normalized = normalizePortfolioData(payload)
    return normalized ?? (await readSeedData())
  } catch {
    return await readSeedData()
  }
}

export async function writePortfolioData(raw) {
  const normalized = normalizePortfolioData(raw)

  if (!normalized) {
    throw new Error('Invalid portfolio payload.')
  }

  normalized.version = 1
  normalized.updatedAt = new Date().toISOString()

  await put(PORTFOLIO_JSON_PATH, JSON.stringify(normalized, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
    cacheControlMaxAge: 60,
  })

  return normalized
}
