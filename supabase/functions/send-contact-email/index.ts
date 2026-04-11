import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

type ContactPayload = {
  name?: string
  email?: string
  message?: string
  submittedAt?: string
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const contactToEmail = Deno.env.get('CONTACT_TO_EMAIL')
  const contactFromEmail =
    Deno.env.get('CONTACT_FROM_EMAIL') ?? 'Contact Form <noreply@yourdomain.com>'

  if (!resendApiKey || !contactToEmail) {
    return jsonResponse(500, {
      error:
        'Missing RESEND_API_KEY or CONTACT_TO_EMAIL in Supabase function secrets.',
    })
  }

  let payload: ContactPayload
  try {
    payload = (await req.json()) as ContactPayload
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON payload.' })
  }

  const name = payload.name?.trim() ?? ''
  const email = payload.email?.trim() ?? ''
  const message = payload.message?.trim() ?? ''
  const submittedAt = payload.submittedAt?.trim() || new Date().toISOString()

  if (!name || !email || !message) {
    return jsonResponse(400, {
      error: 'name, email, and message are required.',
    })
  }

  const subject = `New Contact Inquiry from ${name}`
  const text = [
    `New inquiry submitted from silentspacemedia website.`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    `Submitted At: ${submittedAt}`,
    ``,
    `Message:`,
    message,
  ].join('\n')

  const html = `
    <h2>New Contact Inquiry</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Submitted At:</strong> ${submittedAt}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space: pre-wrap;">${message}</p>
  `

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: contactFromEmail,
      to: [contactToEmail],
      reply_to: email,
      subject,
      text,
      html,
    }),
  })

  if (!resendResponse.ok) {
    const details = await resendResponse.text()
    return jsonResponse(500, { error: 'Email send failed.', details })
  }

  return jsonResponse(200, { ok: true })
})
