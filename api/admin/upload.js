import { handleUpload } from '@vercel/blob/client'
import { isAuthenticated } from '../_lib/auth.js'
import { json, methodNotAllowed } from '../_lib/http.js'

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]

export default async function handler(request) {
  if (request.method !== 'POST') {
    return methodNotAllowed(['POST'])
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid upload request.' }, { status: 400 })
  }

  const isTokenGeneration = body?.type === 'blob.generate-client-token'

  if (isTokenGeneration && !isAuthenticated(request)) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (_pathname, _clientPayload, multipart) => {
        if (!isAuthenticated(request)) {
          throw new Error('Unauthorized')
        }

        return {
          allowedContentTypes: ALLOWED_IMAGE_TYPES,
          addRandomSuffix: true,
          maximumSizeInBytes: multipart ? 1024 * 1024 * 1024 : 50 * 1024 * 1024,
        }
      },
      onUploadCompleted: async () => {
        // Intentionally empty. We persist final URLs when admin clicks Save.
      },
    })

    return json(result)
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : 'Could not complete upload.',
      },
      { status: 400 },
    )
  }
}
