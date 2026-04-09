import { clearSessionCookie } from '../_lib/auth.js'
import { json, methodNotAllowed } from '../_lib/http.js'

export default async function handler(request) {
  if (request.method !== 'POST') {
    return methodNotAllowed(['POST'])
  }

  return json(
    { ok: true },
    {
      headers: {
        'set-cookie': clearSessionCookie(),
      },
    },
  )
}
