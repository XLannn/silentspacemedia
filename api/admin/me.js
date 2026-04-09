import { isAuthenticated } from '../_lib/auth.js'
import { json, methodNotAllowed } from '../_lib/http.js'

export default async function handler(request) {
  if (request.method !== 'GET') {
    return methodNotAllowed(['GET'])
  }

  if (!isAuthenticated(request)) {
    return json({ authenticated: false }, { status: 401 })
  }

  return json({ authenticated: true })
}
