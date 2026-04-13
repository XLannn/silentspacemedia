import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  LogOut,
  Mail,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getContactInquiries } from '../lib/inquiries'
import { getPortfolioData, savePortfolioData, seedPortfolioData } from '../lib/portfolio'
import {
  adminUsersTable,
  isSupabaseConfigured,
  supabase,
  supabaseBucket,
} from '../lib/supabase'
import type {
  PortfolioCategory,
  PortfolioData,
  PortfolioImage,
  PortfolioImageLayout,
} from '../types/portfolio'
import type { ContactInquiry } from '../types/contactInquiry'

type AuthState = 'loading' | 'guest' | 'authed'

type UploadState = {
  categoryId: string | null
  isUploading: boolean
}

type AdminTab = 'portfolio' | 'credentials' | 'inquiries'

const portfolioImageLayoutOptions: Array<{
  value: PortfolioImageLayout
  label: string
}> = [
  { value: 'small', label: 'Small' },
  { value: 'wide', label: 'Wide' },
  { value: 'tall', label: 'Tall' },
  { value: 'feature-left', label: 'Feature Left' },
  { value: 'feature-right', label: 'Feature Right' },
  { value: 'full', label: 'Full Width' },
]

const adminPortfolioImageLayoutClassMap: Record<PortfolioImageLayout, string> = {
  small: 'col-span-1 row-span-1',
  wide: 'col-span-2 row-span-1 xl:col-span-2',
  tall: 'col-span-1 row-span-2',
  'feature-left': 'col-span-2 row-span-2 xl:col-span-2 xl:row-span-2 xl:col-start-1',
  'feature-right':
    'col-span-2 row-span-2 xl:col-span-2 xl:row-span-2 xl:col-start-2',
  full: 'col-span-2 row-span-1 xl:col-span-3',
}

function getPortfolioImageLayoutClass(layout?: PortfolioImageLayout): string {
  if (!layout) {
    return adminPortfolioImageLayoutClassMap.small
  }

  return (
    adminPortfolioImageLayoutClassMap[layout] ??
    adminPortfolioImageLayoutClassMap.small
  )
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

async function resolveAdminEmailByUsername(username: string): Promise<string | null> {
  if (!supabase) {
    return null
  }

  const { data } = await supabase
    .from(adminUsersTable)
    .select('email')
    .eq('username', username)
    .maybeSingle()

  if (data && typeof data.email === 'string' && data.email.trim()) {
    return data.email
  }

  return null
}

async function resolveUsernameByEmail(email: string): Promise<string | null> {
  if (!supabase) {
    return null
  }

  const { data } = await supabase
    .from(adminUsersTable)
    .select('username')
    .eq('email', email)
    .maybeSingle()

  if (data && typeof data.username === 'string' && data.username.trim()) {
    return data.username
  }

  return null
}

function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [sessionEmail, setSessionEmail] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')

  const [data, setData] = useState<PortfolioData>(seedPortfolioData)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [newCategoryTitle, setNewCategoryTitle] = useState('')
  const [uploadState, setUploadState] = useState<UploadState>({
    categoryId: null,
    isUploading: false,
  })
  const [activeTab, setActiveTab] = useState<AdminTab>('portfolio')
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([])
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false)
  const [inquiriesMessage, setInquiriesMessage] = useState('')

  const [newUsername, setNewUsername] = useState('')
  const [usernameCurrentPassword, setUsernameCurrentPassword] = useState('')
  const [showUsernameCurrentPassword, setShowUsernameCurrentPassword] = useState(false)
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [usernameMessage, setUsernameMessage] = useState('')

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')

  useEffect(() => {
    let active = true

    async function checkAuth() {
      if (!isSupabaseConfigured || !supabase) {
        if (active) {
          setAuthState('guest')
          setLoginError(
            'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
          )
        }
        return
      }

      try {
        const { data } = await supabase.auth.getSession()
        if (!active) {
          return
        }

        const session = data.session
        if (!session) {
          setAuthState('guest')
          return
        }

        const email = session.user.email ?? ''
        setSessionEmail(email)
        if (email) {
          const mappedUsername = await resolveUsernameByEmail(email)
          setCurrentUsername(mappedUsername ?? '')
        }

        setAuthState('authed')
        await loadPortfolio()
        await loadInquiries()
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

  useEffect(() => {
    if (authState === 'authed' && activeTab === 'inquiries') {
      void loadInquiries()
    }
  }, [activeTab, authState])

  async function loadPortfolio() {
    try {
      const portfolioData = await getPortfolioData()
      if (portfolioData.categories.length > 0) {
        setData(portfolioData)
      }
    } catch {
      // Keep existing state fallback.
    }
  }

  async function loadInquiries() {
    setIsLoadingInquiries(true)
    setInquiriesMessage('')

    try {
      const result = await getContactInquiries()

      if (result.error) {
        setInquiriesMessage(result.error)
        setIsLoadingInquiries(false)
        return
      }

      setInquiries(result.data ?? [])
      if (!result.data || result.data.length === 0) {
        setInquiriesMessage('No inquiries yet.')
      }
    } catch {
      setInquiriesMessage('Could not load inquiries. Please try again.')
    } finally {
      setIsLoadingInquiries(false)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoggingIn(true)
    setLoginError('')

    if (!isSupabaseConfigured || !supabase) {
      setLoginError(
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      )
      setIsLoggingIn(false)
      return
    }

    try {
      const normalizedIdentifier = loginIdentifier.trim()
      const looksLikeEmail = normalizedIdentifier.includes('@')
      const loginEmail = looksLikeEmail
        ? normalizedIdentifier
        : await resolveAdminEmailByUsername(normalizedIdentifier)

      if (!loginEmail) {
        setLoginError('Invalid username or password.')
        setIsLoggingIn(false)
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })

      if (error) {
        setLoginError('Invalid username or password.')
        setIsLoggingIn(false)
        return
      }

      setAuthState('authed')
      setSessionEmail(loginEmail)
      if (looksLikeEmail) {
        const mappedUsername = await resolveUsernameByEmail(loginEmail)
        setCurrentUsername(mappedUsername ?? '')
      } else {
        setCurrentUsername(normalizedIdentifier)
      }
      setPassword('')
      setShowLoginPassword(false)
      await loadPortfolio()
      await loadInquiries()
    } catch {
      setLoginError('Login failed. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut()
    }

    setAuthState('guest')
    setLoginIdentifier('')
    setPassword('')
    setShowLoginPassword(false)
    setSessionEmail('')
    setCurrentUsername('')
    setActiveTab('portfolio')
    setSaveMessage('')
    setUsernameMessage('')
    setPasswordMessage('')
    setInquiries([])
    setInquiriesMessage('')
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

  function moveImage(
    categoryId: string,
    imageId: string,
    direction: 'up' | 'down',
  ) {
    updateCategories((categories) =>
      categories.map((category) => {
        if (category.id !== categoryId) {
          return category
        }

        const currentIndex = category.images.findIndex((image) => image.id === imageId)
        if (currentIndex < 0) {
          return category
        }

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
        if (targetIndex < 0 || targetIndex >= category.images.length) {
          return category
        }

        const nextImages = [...category.images]
        const [movedImage] = nextImages.splice(currentIndex, 1)
        nextImages.splice(targetIndex, 0, movedImage)

        return {
          ...category,
          images: nextImages,
        }
      }),
    )
  }

  function updateImageLayout(
    categoryId: string,
    imageId: string,
    layout: PortfolioImageLayout,
  ) {
    updateCategories((categories) =>
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              images: category.images.map((image) =>
                image.id === imageId ? { ...image, layout } : image,
              ),
            }
          : category,
      ),
    )
  }

  async function uploadImages(categoryId: string, files: FileList | null) {
    if (!files || files.length === 0) {
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      setSaveMessage(
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      )
      return
    }

    setUploadState({ categoryId, isUploading: true })
    setSaveMessage('')

    try {
      const uploadedImages: PortfolioImage[] = []

      for (const file of Array.from(files)) {
        const pathname = `${categoryId}/${Date.now()}-${safeFileName(file.name)}`
        const { data: uploadData, error } = await supabase.storage
          .from(supabaseBucket)
          .upload(pathname, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || undefined,
          })

        if (error || !uploadData) {
          throw error ?? new Error('Upload failed')
        }

        const { data: publicData } = supabase.storage
          .from(supabaseBucket)
          .getPublicUrl(uploadData.path)

        if (!publicData.publicUrl) {
          throw new Error('Could not create a public URL')
        }

        uploadedImages.push({
          id: createClientId('image'),
          url: publicData.publicUrl,
          pathname: uploadData.path,
          layout: 'small',
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
      const result = await savePortfolioData(data.categories)

      if (result.error) {
        setSaveMessage(result.error)
        setIsSaving(false)
        return
      }

      if (result.data) {
        setData(result.data)
      }

      setSaveMessage('Saved successfully.')
    } catch {
      setSaveMessage('Save failed. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !sessionEmail) {
      setUsernameMessage('No active admin session found. Please login again.')
      return
    }

    const trimmedNewUsername = newUsername.trim()

    if (!currentUsername) {
      setUsernameMessage(
        'Current username mapping was not found. Add a row in admin_users first.',
      )
      return
    }

    if (!trimmedNewUsername) {
      setUsernameMessage('New username cannot be empty.')
      return
    }

    if (trimmedNewUsername === currentUsername) {
      setUsernameMessage('New username is the same as current username.')
      return
    }

    if (!usernameCurrentPassword) {
      setUsernameMessage('Enter current password to confirm username change.')
      return
    }

    setIsUpdatingUsername(true)
    setUsernameMessage('')

    try {
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: sessionEmail,
        password: usernameCurrentPassword,
      })

      if (reAuthError) {
        setUsernameMessage('Current password is incorrect.')
        setIsUpdatingUsername(false)
        return
      }

      const { data: usernameOwner, error: usernameCheckError } = await supabase
        .from(adminUsersTable)
        .select('email')
        .eq('username', trimmedNewUsername)
        .maybeSingle()

      if (usernameCheckError) {
        setUsernameMessage(usernameCheckError.message)
        setIsUpdatingUsername(false)
        return
      }

      if (usernameOwner && usernameOwner.email !== sessionEmail) {
        setUsernameMessage('That username is already in use.')
        setIsUpdatingUsername(false)
        return
      }

      const { data: currentMapping, error: mappingFindError } = await supabase
        .from(adminUsersTable)
        .select('username')
        .eq('email', sessionEmail)
        .maybeSingle()

      if (mappingFindError) {
        setUsernameMessage(mappingFindError.message)
        setIsUpdatingUsername(false)
        return
      }

      if (currentMapping) {
        const { error: mappingUpdateError } = await supabase
          .from(adminUsersTable)
          .update({ username: trimmedNewUsername })
          .eq('email', sessionEmail)

        if (mappingUpdateError) {
          setUsernameMessage(mappingUpdateError.message)
          setIsUpdatingUsername(false)
          return
        }
      } else {
        const { error: mappingInsertError } = await supabase
          .from(adminUsersTable)
          .insert({ username: trimmedNewUsername, email: sessionEmail })

        if (mappingInsertError) {
          setUsernameMessage(mappingInsertError.message)
          setIsUpdatingUsername(false)
          return
        }
      }

      setCurrentUsername(trimmedNewUsername)
      setNewUsername('')
      setUsernameCurrentPassword('')
      setShowUsernameCurrentPassword(false)
      setUsernameMessage('Username updated successfully.')
    } catch {
      setUsernameMessage('Could not update username. Please try again.')
    } finally {
      setIsUpdatingUsername(false)
    }
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !sessionEmail) {
      setPasswordMessage('No active admin session found. Please login again.')
      return
    }

    if (!oldPassword) {
      setPasswordMessage('Enter your current password.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('New password and confirm password do not match.')
      return
    }

    setIsUpdatingPassword(true)
    setPasswordMessage('')

    try {
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: sessionEmail,
        password: oldPassword,
      })

      if (reAuthError) {
        setPasswordMessage('Current password is incorrect.')
        setIsUpdatingPassword(false)
        return
      }

      const { error: passwordUpdateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (passwordUpdateError) {
        setPasswordMessage(passwordUpdateError.message)
        setIsUpdatingPassword(false)
        return
      }

      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowOldPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
      setPasswordMessage('Password updated successfully.')
    } catch {
      setPasswordMessage('Could not update password. Please try again.')
    } finally {
      setIsUpdatingPassword(false)
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
              Sign in with your admin username/email and password.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleLogin}>
              <label className="block space-y-2 text-sm">
                <span>Username or Email</span>
                <input
                  className="w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 outline-none ring-cyan-300/70 transition focus:ring-2"
                  value={loginIdentifier}
                  onChange={(event) => setLoginIdentifier(event.target.value)}
                  type="text"
                  autoComplete="username"
                  placeholder="username or email"
                  required
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span>Password</span>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 pr-12 outline-none ring-cyan-300/70 transition focus:ring-2"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    className="absolute right-5 top-1/2 z-10 inline-flex h-10 w-5 -translate-y-1/2 items-center justify-center text-slate-300 transition hover:text-white focus:outline-none"
                    type="button"
                    onClick={() => setShowLoginPassword((value) => !value)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>
              <div className="text-right">
                <Link
                  className="text-sm text-cyan-200 transition hover:text-cyan-100"
                  to="/admin/forgot-password"
                >
                  Forgot password?
                </Link>
              </div>

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
                Manage portfolio and credentials from one place.
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

          <div className="mt-6 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'portfolio'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('portfolio')}
              type="button"
            >
              Edit Portfolio
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'credentials'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('credentials')}
              type="button"
            >
              Credentials
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'inquiries'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('inquiries')}
              type="button"
            >
              Inquiries
            </button>
          </div>
        </header>

        {activeTab === 'credentials' ? (
          <section className="rounded-[2rem] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-slate-900">
              Admin Credentials
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Current username:{' '}
              <span className="font-semibold">{currentUsername || '(not mapped)'}</span>
            </p>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <form
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                onSubmit={handleUpdateUsername}
              >
                <h3 className="text-lg font-semibold text-slate-900">Change Username</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Enter a new username and confirm with your current password.
                </p>

                <div className="mt-4 space-y-4">
                  <label className="block space-y-2 text-sm text-slate-700">
                    <span>New Username</span>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-slate-300 transition focus:ring-2"
                      type="text"
                      value={newUsername}
                      onChange={(event) => setNewUsername(event.target.value)}
                      required
                    />
                  </label>

                  <label className="block space-y-2 text-sm text-slate-700">
                    <span>Current Password</span>
                    <div className="relative">
                      <input
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none ring-slate-300 transition focus:ring-2"
                        type={showUsernameCurrentPassword ? 'text' : 'password'}
                        value={usernameCurrentPassword}
                        onChange={(event) => setUsernameCurrentPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        className="absolute right-5 top-1/2 z-10 inline-flex h-10 w-5 -translate-y-1/2 items-center justify-center text-slate-400 transition hover:text-slate-700 focus:outline-none"
                        type="button"
                        onClick={() =>
                          setShowUsernameCurrentPassword((value) => !value)
                        }
                        aria-label={
                          showUsernameCurrentPassword
                            ? 'Hide current password'
                            : 'Show current password'
                        }
                      >
                        {showUsernameCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    {usernameMessage || 'Your current username will be replaced.'}
                  </p>
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70"
                    type="submit"
                    disabled={isUpdatingUsername}
                  >
                    {isUpdatingUsername ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    <span>{isUpdatingUsername ? 'Updating...' : 'Change Username'}</span>
                  </button>
                </div>
              </form>

              <form
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                onSubmit={handleUpdatePassword}
              >
                <h3 className="text-lg font-semibold text-slate-900">Change Password</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Confirm old password, then set a new password.
                </p>

                <div className="mt-4 space-y-4">
                  <label className="block space-y-2 text-sm text-slate-700">
                    <span>Old Password</span>
                    <div className="relative">
                      <input
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none ring-slate-300 transition focus:ring-2"
                        type={showOldPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(event) => setOldPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        className="absolute right-5 top-1/2 z-10 inline-flex h-10 w-5 -translate-y-1/2 items-center justify-center text-slate-400 transition hover:text-slate-700 focus:outline-none"
                        type="button"
                        onClick={() => setShowOldPassword((value) => !value)}
                        aria-label={showOldPassword ? 'Hide old password' : 'Show old password'}
                      >
                        {showOldPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </label>

                  <label className="block space-y-2 text-sm text-slate-700">
                    <span>New Password</span>
                    <div className="relative">
                      <input
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none ring-slate-300 transition focus:ring-2"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        className="absolute right-5 top-1/2 z-10 inline-flex h-10 w-5 -translate-y-1/2 items-center justify-center text-slate-400 transition hover:text-slate-700 focus:outline-none"
                        type="button"
                        onClick={() => setShowNewPassword((value) => !value)}
                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </label>

                  <label className="block space-y-2 text-sm text-slate-700">
                    <span>Confirm New Password</span>
                    <div className="relative">
                      <input
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none ring-slate-300 transition focus:ring-2"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        className="absolute right-5 top-1/2 z-10 inline-flex h-10 w-5 -translate-y-1/2 items-center justify-center text-slate-400 transition hover:text-slate-700 focus:outline-none"
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        aria-label={
                          showConfirmPassword
                            ? 'Hide confirm password'
                            : 'Show confirm password'
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    {passwordMessage || 'Minimum 8 characters.'}
                  </p>
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70"
                    type="submit"
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    <span>{isUpdatingPassword ? 'Updating...' : 'Change Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        ) : null}

        {activeTab === 'inquiries' ? (
          <section className="rounded-[2rem] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl font-bold text-slate-900">
                  Contact Inquiries
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  New submissions from your contact forms appear here.
                </p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:opacity-70"
                onClick={() => void loadInquiries()}
                type="button"
                disabled={isLoadingInquiries}
              >
                {isLoadingInquiries ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                <span>{isLoadingInquiries ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {inquiries.map((inquiry) => (
                <article
                  key={inquiry.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">{inquiry.name}</h3>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      {new Date(inquiry.created_at).toLocaleString()}
                    </p>
                  </div>
                  <a
                    className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-900"
                    href={`mailto:${inquiry.email}`}
                  >
                    <Mail className="h-4 w-4" />
                    <span>{inquiry.email}</span>
                  </a>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {inquiry.message}
                  </p>
                </article>
              ))}
            </div>

            {!isLoadingInquiries && inquiries.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                {inquiriesMessage || 'No inquiries yet.'}
              </p>
            ) : null}

            {inquiriesMessage && inquiries.length > 0 ? (
              <p className="mt-4 text-sm text-slate-500">{inquiriesMessage}</p>
            ) : null}
          </section>
        ) : null}

        {activeTab === 'portfolio' ? (
          <>
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
                <p className="mt-3 text-xs text-slate-500">
                  Set layout per image (Small, Wide, Tall, Feature Left/Right, Full Width) and move order to shape each category grid.
                </p>
              </div>

              <div className="mt-5 grid auto-rows-[150px] grid-cols-2 grid-flow-dense gap-4 xl:auto-rows-[170px] xl:grid-cols-3">
                {category.images.map((image, imageIndex) => (
                  <div
                    key={image.id}
                    className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${getPortfolioImageLayoutClass(
                      image.layout,
                    )}`}
                  >
                    <div className="h-[calc(100%-64px)] min-h-[80px] overflow-hidden rounded-t-[1rem] bg-slate-100 p-1">
                      <img
                        alt={`${category.title} preview`}
                        className="h-full w-full rounded-[0.85rem] object-contain"
                        src={image.url}
                      />
                    </div>
                    <div className="flex h-16 items-center gap-2 border-t border-slate-200 px-2">
                      <select
                        className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 outline-none ring-slate-300 transition focus:ring-2"
                        value={image.layout ?? 'small'}
                        onChange={(event) =>
                          updateImageLayout(
                            category.id,
                            image.id,
                            event.target.value as PortfolioImageLayout,
                          )
                        }
                        title="Image layout"
                      >
                        {portfolioImageLayoutOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:border-slate-900 hover:text-slate-900 disabled:opacity-50"
                        onClick={() => moveImage(category.id, image.id, 'up')}
                        type="button"
                        title="Move earlier"
                        disabled={imageIndex === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:border-slate-900 hover:text-slate-900 disabled:opacity-50"
                        onClick={() => moveImage(category.id, image.id, 'down')}
                        type="button"
                        title="Move later"
                        disabled={imageIndex === category.images.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="rounded-lg border border-red-300 p-2 text-red-600 transition hover:border-red-500 hover:bg-red-50"
                        onClick={() => removeImage(category.id, image.id)}
                        type="button"
                        title="Remove image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
                <p className="text-sm text-slate-600">
                  {saveMessage || 'All changes are local until you save.'}
                </p>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70"
                  onClick={savePortfolio}
                  type="button"
                  disabled={isSaving || uploadState.isUploading}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save Portfolio'}</span>
                </button>
              </div>
            </footer>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default AdminPage
