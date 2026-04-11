import {
  contactInquiriesTable,
  contactNotifyWebhookUrl,
  isSupabaseConfigured,
  publicSupabaseAnonKey,
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

  if (contactNotifyWebhookUrl) {
    try {
      await fetch(contactNotifyWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(publicSupabaseAnonKey
            ? {
                apikey: publicSupabaseAnonKey,
                Authorization: `Bearer ${publicSupabaseAnonKey}`,
              }
            : {}),
        },
        body: JSON.stringify({
          type: 'contact_inquiry',
          submittedAt: new Date().toISOString(),
          ...payload,
        }),
      })
    } catch {
      // Keep form success even if webhook fails.
    }
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
