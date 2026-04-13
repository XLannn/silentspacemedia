import {
  contactFormSubmitEndpoint,
  contactInquiriesTable,
  isSupabaseConfigured,
  supabase,
} from './supabase'
import type { ContactInquiry, ContactInquiryInput } from '../types/contactInquiry'

type SubmitInquiryResult = {
  error?: string
}

type LoadInquiriesResult = {
  data?: ContactInquiry[]
  error?: string
}

export async function submitContactInquiry(
  input: ContactInquiryInput,
): Promise<SubmitInquiryResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      error:
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    }
  }

  const payload = {
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
  }

  const { error } = await supabase.from(contactInquiriesTable).insert(payload)

  if (error) {
    return { error: error.message }
  }

  try {
    await fetch(contactFormSubmitEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        submittedAt: new Date().toISOString(),
        _subject: `New Contact Inquiry from ${payload.name}`,
        _captcha: 'false',
        _template: 'table',
      }),
    })
  } catch {
    // Keep form success even if email notification fails.
  }

  return {}
}

export async function getContactInquiries(): Promise<LoadInquiriesResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      error:
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    }
  }

  const { data, error } = await supabase
    .from(contactInquiriesTable)
    .select('id,name,email,message,created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return { error: error.message }
  }

  return { data: (data as ContactInquiry[]) ?? [] }
}
