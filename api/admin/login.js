import { createSessionCookie, verifyAdminCredentials } from '../_lib/auth.js'
import { json, methodNotAllowed } from '../_lib/http.js'

export default async function handler(request) {
  if (request.method !== 'POST') {
    return methodNotAllowed(['POST'])
  }

  let payload
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const username = typeof payload.username === 'string' ? payload.username : ''
  const password = typeof payload.password === 'string' ? payload.password : ''

  try {
    if (!verifyAdminCredentials(username, password)) {
      return json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    return json(
      { ok: true },
      {
        headers: {
          'set-cookie': createSessionCookie(username),
        },
      },
    )
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Missing admin environment configuration.',
      },
      { status: 500 },
    )
  }
}
