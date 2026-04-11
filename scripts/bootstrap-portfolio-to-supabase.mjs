import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = process.env.VITE_SUPABASE_STORAGE_BUCKET || 'portfolio-images'
  const table = process.env.VITE_SUPABASE_PORTFOLIO_TABLE || 'portfolio_content'

  if (!supabaseUrl) {
    throw new Error('Missing VITE_SUPABASE_URL (or SUPABASE_URL).')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local.')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const seedPath = path.join(root, 'src', 'data', 'portfolioSeed.json')
  const assetsPath = path.join(root, 'public', 'assets')

  const seedRaw = await readFile(seedPath, 'utf8')
  const seed = JSON.parse(seedRaw)

  const uniqueFileNames = [...new Set(seed.flatMap((category) => category.images))]
  const uploadedMap = new Map()

  console.log(`Uploading ${uniqueFileNames.length} image files to Supabase Storage...`)

  for (const imageName of uniqueFileNames) {
    const filePath = path.join(assetsPath, imageName)
    const fileBody = await readFile(filePath)
    const storagePath = `seed/${imageName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBody, { upsert: true })

    if (error || !data) {
      throw new Error(`Failed to upload ${imageName}: ${error?.message || 'Unknown error'}`)
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    uploadedMap.set(imageName, {
      pathname: data.path,
      url: publicData.publicUrl,
    })

    console.log(`Uploaded: ${imageName}`)
  }

  const categories = seed.map((category, categoryIndex) => {
    const categorySlug = slugify(category.title) || `category-${categoryIndex + 1}`

    return {
      id: `${categorySlug}-${categoryIndex + 1}`,
      title: category.title,
      images: category.images.map((imageName, imageIndex) => {
        const uploaded = uploadedMap.get(imageName)
        return {
          id: `${categorySlug}-image-${imageIndex + 1}`,
          url: uploaded.url,
          pathname: uploaded.pathname,
        }
      }),
    }
  })

  const payload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    categories,
  }

  const { error: upsertError } = await supabase.from(table).upsert(
    {
      id: 'primary',
      data: payload,
      updated_at: payload.updatedAt,
    },
    { onConflict: 'id' },
  )

  if (upsertError) {
    throw new Error(`Failed to save portfolio content: ${upsertError.message}`)
  }

  console.log('Portfolio metadata saved.')
  console.log('Bootstrap complete.')
}

main().catch((error) => {
  console.error('Bootstrap failed.')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
