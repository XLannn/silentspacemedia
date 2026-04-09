import { json, methodNotAllowed } from './_lib/http.js'
import { readPortfolioData } from './_lib/portfolio-store.js'

export default async function handler(request) {
  if (request.method !== 'GET') {
    return methodNotAllowed(['GET'])
  }

  const data = await readPortfolioData()
  return json(data)
}
