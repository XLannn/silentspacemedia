import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const SESSION_COOKIE_NAME = 'ssm_admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

function getRequiredEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url')
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(payload) {
  const secret = getRequiredEnv('ADMIN_SESSION_SECRET')
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function hashCredential(value) {
  return createHash('sha256').update(value).digest()
}

function safeCompare(a, b) {
  const left = hashCredential(a)
  const right = hashCredential(b)
  return timingSafeEqual(left, right)
}

function parseCookieHeader(cookieHeader) {
  const parsed = {}

  if (!cookieHeader) {
    return parsed
  }

  for (const pair of cookieHeader.split(';')) {
    const [rawKey, ...rawValue] = pair.trim().split('=')
    if (!rawKey) {
      continue
    }

    parsed[rawKey] = decodeURIComponent(rawValue.join('='))
  }

  return parsed
}

function createSessionToken(username) {
  const payload = base64UrlEncode(
    JSON.stringify({
      username,
      exp: Date.now() + SESSION_TTL_SECONDS * 1000,
    }),
  )

  const signature = sign(payload)
  return `${payload}.${signature}`
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return false
  }

  const [payload, receivedSignature] = token.split('.')
  const expectedSignature = sign(payload)

  if (!safeCompare(receivedSignature, expectedSignature)) {
    return false
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload))
    return typeof parsed.exp === 'number' && parsed.exp > Date.now()
  } catch {
    return false
  }
}

export function verifyAdminCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') {
    return false
  }

  const expectedUsername = getRequiredEnv('ADMIN_USERNAME')
  const expectedPassword = getRequiredEnv('ADMIN_PASSWORD')

  return safeCompare(username, expectedUsername) && safeCompare(password, expectedPassword)
}

export function isAuthenticated(request) {
  try {
    const cookieHeader = request.headers.get('cookie')
    const cookies = parseCookieHeader(cookieHeader)
    return verifySessionToken(cookies[SESSION_COOKIE_NAME])
  } catch {
    return false
  }
}

export function createSessionCookie(username) {
  const token = createSessionToken(username)
  const secureFlag =
    process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'

  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`,
    secureFlag ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

export function clearSessionCookie() {
  const secureFlag =
    process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'

  return [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    secureFlag ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}
