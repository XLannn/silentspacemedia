export type ContactInquiry = {
  id: number
  name: string
  email: string
  message: string
  created_at: string
}

export type ContactInquiryInput = {
  name: string
  email: string
  message: string
}
