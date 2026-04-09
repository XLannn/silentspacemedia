import { isAuthenticated } from '../_lib/auth.js'
import { json, methodNotAllowed } from '../_lib/http.js'
import { readPortfolioData, writePortfolioData } from '../_lib/portfolio-store.js'

export default async function handler(request) {
  if (!isAuthenticated(request)) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (request.method === 'GET') {
    const data = await readPortfolioData()
    return json(data)
  }

  if (request.method === 'PUT') {
    let payload

    try {
      payload = await request.json()
    } catch {
      return json({ error: 'Invalid request body.' }, { status: 400 })
    }

    try {
      const data = await writePortfolioData({
        categories: payload.categories,
      })

      return json(data)
    } catch (error) {
      return json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Could not save portfolio data.',
        },
        { status: 400 },
      )
    }
  }

  return methodNotAllowed(['GET', 'PUT'])
}
