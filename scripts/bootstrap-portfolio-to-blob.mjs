import { put } from '@vercel/blob'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORTFOLIO_JSON_PATH = 'portfolio/portfolio-data.json'
const IMAGE_PREFIX = 'portfolio/images'

const contentTypeByExtension = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function contentTypeForFile(fileName) {
  const extension = path.extname(fileName).toLowerCase()
  return contentTypeByExtension[extension] ?? 'application/octet-stream'
}

function applyEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) {
    return
  }

  const equalsIndex = trimmed.indexOf('=')
  if (equalsIndex <= 0) {
    return
  }

  const key = trimmed.slice(0, equalsIndex).trim()
  const rawValue = trimmed.slice(equalsIndex + 1).trim()
  const value = rawValue.replace(/^['"]|['"]$/g, '')

  if (!process.env[key]) {
    process.env[key] = value
  }
}

async function loadDotEnv(root) {
  const candidates = ['.env.local', '.env']

  for (const fileName of candidates) {
    try {
      const envFile = await readFile(path.join(root, fileName), 'utf8')
      for (const line of envFile.split(/\r?\n/)) {
        applyEnvLine(line)
      }
    } catch {
      // Ignore missing env files.
    }
  }
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  await loadDotEnv(root)

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'Missing BLOB_READ_WRITE_TOKEN. Add it to your local .env before running this script.',
    )
  }

  const seedPath = path.join(root, 'src', 'data', 'portfolioSeed.json')
  const assetsPath = path.join(root, 'public', 'assets')

  const seedRaw = await readFile(seedPath, 'utf8')
  const seed = JSON.parse(seedRaw)

  const uniqueFileNames = [...new Set(seed.flatMap((category) => category.images))]
  const uploadedMap = new Map()

  console.log(`Uploading ${uniqueFileNames.length} image files to Vercel Blob...`)

  for (const imageName of uniqueFileNames) {
    const filePath = path.join(assetsPath, imageName)
    const fileBody = await readFile(filePath)
    const pathname = `${IMAGE_PREFIX}/${imageName}`

    const blob = await put(pathname, fileBody, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: contentTypeForFile(imageName),
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    })

    uploadedMap.set(imageName, blob)
    console.log(`Uploaded: ${imageName}`)
  }

  const categories = seed.map((category, categoryIndex) => {
    const categorySlug = slugify(category.title) || `category-${categoryIndex + 1}`

    return {
      id: `${categorySlug}-${categoryIndex + 1}`,
      title: category.title,
      images: category.images.map((imageName, imageIndex) => {
        const blob = uploadedMap.get(imageName)
        return {
          id: `${categorySlug}-image-${imageIndex + 1}`,
          url: blob.url,
          pathname: blob.pathname,
        }
      }),
    }
  })

  const payload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    categories,
  }

  await put(PORTFOLIO_JSON_PATH, JSON.stringify(payload, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
    cacheControlMaxAge: 60,
  })

  console.log('Portfolio metadata uploaded.')
  console.log('Bootstrap complete.')
}

main().catch((error) => {
  console.error('Bootstrap failed.')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
