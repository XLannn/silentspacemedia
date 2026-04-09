import { upload } from '@vercel/blob/client'
import { ArrowDown, ArrowUp, ImagePlus, Loader2, LogOut, Plus, Save, Trash2 } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { normalizePortfolioData, seedPortfolioData } from '../lib/portfolio'
import type {
  PortfolioCategory,
  PortfolioData,
  PortfolioImage,
} from '../types/portfolio'

type AuthState = 'loading' | 'guest' | 'authed'

type UploadState = {
  categoryId: string | null
  isUploading: boolean
}

async function readJsonSafe(response: Response): Promise<unknown | null> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return (await response.json()) as unknown
  } catch {
    return null
  }
}

function createClientId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
}

function safeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
}

function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [data, setData] = useState<PortfolioData>(seedPortfolioData)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [newCategoryTitle, setNewCategoryTitle] = useState('')
  const [uploadState, setUploadState] = useState<UploadState>({
    categoryId: null,
    isUploading: false,
  })

  useEffect(() => {
    let active = true

    async function checkAuth() {
      try {
        const response = await fetch('/api/admin/me', { credentials: 'include' })
        const body = await readJsonSafe(response)
        if (!active) {
          return
        }

        const isAuthed =
          response.ok &&
          body !== null &&
          typeof body === 'object' &&
          (body as { authenticated?: boolean }).authenticated === true

        if (isAuthed) {
          setAuthState('authed')
          await loadPortfolio()
        } else {
          setAuthState('guest')
        }
      } catch {
        if (active) {
          setAuthState('guest')
        }
      }
    }

    void checkAuth()

    return () => {
      active = false
    }
  }, [])

  async function loadPortfolio() {
    try {
      const response = await fetch('/api/admin/portfolio', {
        credentials: 'include',
      })

      if (!response.ok) {
        return
      }

      const raw = (await response.json()) as unknown
      const normalized = normalizePortfolioData(raw)

      if (normalized) {
        setData(normalized)
      }
    } catch {
      // Keep existing state fallback.
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoggingIn(true)
    setLoginError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const contentType = response.headers.get('content-type') ?? ''

      if (
        response.status === 404 ||
        contentType.includes('text/html') ||
        contentType.includes('javascript')
      ) {
        setLoginError(
          'Admin API is not running. Start with `npx vercel dev` and open http://localhost:3000/admin.',
        )
        setIsLoggingIn(false)
        return
      }

      if (!response.ok) {
        const body = await readJsonSafe(response)
        const message =
          body !== null &&
          typeof body === 'object' &&
          typeof (body as { error?: unknown }).error === 'string'
            ? (body as { error: string }).error
            : 'Invalid username or password.'
        setLoginError(message)
        setIsLoggingIn(false)
        return
      }

      const body = await readJsonSafe(response)
      const didLogin =
        body !== null &&
        typeof body === 'object' &&
        (body as { ok?: boolean }).ok === true

      if (!didLogin) {
        setLoginError(
          'Admin API is not available in this runtime. Use `vercel dev` locally, or deploy on Vercel.',
        )
        setIsLoggingIn(false)
        return
      }

      setAuthState('authed')
      setPassword('')
      await loadPortfolio()
    } catch {
      setLoginError('Login failed. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
    })

    setAuthState('guest')
    setUsername('')
    setPassword('')
    setSaveMessage('')
  }

  function updateCategories(
    updater: (categories: PortfolioCategory[]) => PortfolioCategory[],
  ) {
    setData((current) => ({
      ...current,
      categories: updater(current.categories),
      updatedAt: new Date().toISOString(),
    }))
    setSaveMessage('')
  }

  function addCategory() {
    const title = newCategoryTitle.trim()
    if (!title) {
      return
    }

    const category: PortfolioCategory = {
      id: createClientId('category'),
      title,
      images: [],
    }

    updateCategories((categories) => [...categories, category])
    setNewCategoryTitle('')
  }

  function deleteCategory(categoryId: string) {
    updateCategories((categories) =>
      categories.filter((category) => category.id !== categoryId),
    )
  }

  function renameCategory(categoryId: string, title: string) {
    updateCategories((categories) =>
      categories.map((category) =>
        category.id === categoryId ? { ...category, title } : category,
      ),
    )
  }

  function moveCategory(categoryId: string, direction: 'up' | 'down') {
    updateCategories((categories) => {
      const index = categories.findIndex((category) => category.id === categoryId)
      if (index < 0) {
        return categories
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= categories.length) {
        return categories
      }

      const next = [...categories]
      const [category] = next.splice(index, 1)
      next.splice(targetIndex, 0, category)
      return next
    })
  }

  function removeImage(categoryId: string, imageId: string) {
    updateCategories((categories) =>
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              images: category.images.filter((image) => image.id !== imageId),
            }
          : category,
      ),
    )
  }

  async function uploadImages(categoryId: string, files: FileList | null) {
    if (!files || files.length === 0) {
      return
    }

    setUploadState({ categoryId, isUploading: true })
    setSaveMessage('')

    try {
      const uploadedImages: PortfolioImage[] = []

      for (const file of Array.from(files)) {
        const pathname = `portfolio/images/${Date.now()}-${safeFileName(file.name)}`

        const blob = await upload(pathname, file, {
          access: 'public',
          handleUploadUrl: '/api/admin/upload',
          multipart: true,
          clientPayload: JSON.stringify({ categoryId }),
        })

        uploadedImages.push({
          id: createClientId('image'),
          url: blob.url,
          pathname: blob.pathname,
        })
      }

      updateCategories((categories) =>
        categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                images: [...category.images, ...uploadedImages],
              }
            : category,
        ),
      )
    } catch {
      setSaveMessage('Image upload failed. Please try again.')
    } finally {
      setUploadState({ categoryId: null, isUploading: false })
    }
  }

  async function savePortfolio() {
    setIsSaving(true)
    setSaveMessage('')

    try {
      const response = await fetch('/api/admin/portfolio', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          categories: data.categories,
        }),
      })

      if (!response.ok) {
        const body = await readJsonSafe(response)
        const message =
          body !== null &&
          typeof body === 'object' &&
          typeof (body as { error?: unknown }).error === 'string'
            ? (body as { error: string }).error
            : 'Could not save. Please check your environment variables.'

        setSaveMessage(message)
        setIsSaving(false)
        return
      }

      const raw = await readJsonSafe(response)
      const normalized = normalizePortfolioData(raw)
      if (normalized) {
        setData(normalized)
      }

      setSaveMessage('Saved successfully.')
    } catch {
      setSaveMessage('Save failed. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (authState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117] px-6 text-white">
        <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking admin session...</span>
        </div>
      </div>
    )
  }

  if (authState === 'guest') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0b1020] text-white">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
          <div className="w-full max-w-md rounded-[2rem] border border-white/20 bg-white/10 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">
              Admin
            </p>
            <h1 className="font-heading mt-4 text-3xl font-bold">Portfolio Manager</h1>
            <p className="mt-3 text-sm text-slate-200">
              Sign in with your admin credentials from `.env.local` (or Vercel project env vars).
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleLogin}>
              <label className="block space-y-2 text-sm">
                <span>Username</span>
                <input
                  className="w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 outline-none ring-cyan-300/70 transition focus:ring-2"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  type="text"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span>Password</span>
                <input
                  className="w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 outline-none ring-cyan-300/70 transition focus:ring-2"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>

              {loginError ? (
                <p className="rounded-xl border border-red-300/50 bg-red-500/20 px-3 py-2 text-sm text-red-100">
                  {loginError}
                </p>
              ) : null}

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:opacity-70"
                type="submit"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{isLoggingIn ? 'Signing in...' : 'Sign in'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                Admin
              </p>
              <h1 className="font-heading mt-2 text-3xl font-bold text-slate-900">
                Portfolio Editor
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Manage categories, order, and upload images directly to Vercel Blob.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              onClick={handleLogout}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        <section className="rounded-[2rem] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex-1 space-y-2 text-sm text-slate-700">
              <span>New category title</span>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-slate-300 transition focus:ring-2"
                value={newCategoryTitle}
                onChange={(event) => setNewCategoryTitle(event.target.value)}
                placeholder="Example: Product Campaigns"
                type="text"
              />
            </label>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              onClick={addCategory}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>
        </section>

        <div className="space-y-5">
          {data.categories.map((category, index) => (
            <section
              key={category.id}
              className="rounded-[2rem] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8"
            >
              <div className="flex flex-wrap items-center gap-3">
                <input
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-semibold text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
                  value={category.title}
                  onChange={(event) =>
                    renameCategory(category.id, event.target.value)
                  }
                />
                <button
                  className="rounded-xl border border-slate-300 p-2 transition hover:border-slate-900"
                  onClick={() => moveCategory(category.id, 'up')}
                  type="button"
                  disabled={index === 0}
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  className="rounded-xl border border-slate-300 p-2 transition hover:border-slate-900"
                  onClick={() => moveCategory(category.id, 'down')}
                  type="button"
                  disabled={index === data.categories.length - 1}
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  className="rounded-xl border border-red-300 p-2 text-red-600 transition hover:border-red-500 hover:bg-red-50"
                  onClick={() => deleteCategory(category.id)}
                  type="button"
                  title="Delete category"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900">
                  {uploadState.isUploading && uploadState.categoryId === category.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  <span>
                    {uploadState.isUploading && uploadState.categoryId === category.id
                      ? 'Uploading...'
                      : 'Upload Images'}
                  </span>
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      void uploadImages(category.id, event.target.files)
                      event.currentTarget.value = ''
                    }}
                    disabled={uploadState.isUploading}
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.images.map((image) => (
                  <div
                    key={image.id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                  >
                    <img
                      alt={`${category.title} preview`}
                      className="h-56 w-full object-cover"
                      src={image.url}
                    />
                    <div className="absolute inset-x-2 bottom-2 flex justify-end opacity-0 transition group-hover:opacity-100">
                      <button
                        className="rounded-lg bg-white/90 p-2 text-red-600 shadow"
                        onClick={() => removeImage(category.id, image.id)}
                        type="button"
                        title="Remove image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {category.images.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                    No images yet in this category.
                  </div>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        <footer className="sticky bottom-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
            <p className="text-sm text-slate-600">{saveMessage || 'All changes are local until you save.'}</p>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70"
              onClick={savePortfolio}
              type="button"
              disabled={isSaving || uploadState.isUploading}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isSaving ? 'Saving...' : 'Save Portfolio'}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default AdminPage
