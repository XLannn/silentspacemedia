export const PORTFOLIO_IMAGE_LAYOUTS = [
  'small',
  'wide',
  'tall',
  'feature-left',
  'feature-right',
  'full',
] as const

export type PortfolioImageLayout = (typeof PORTFOLIO_IMAGE_LAYOUTS)[number]

export type PortfolioImage = {
  id: string
  url: string
  pathname?: string
  layout?: PortfolioImageLayout
}

export type PortfolioCategory = {
  id: string
  title: string
  images: PortfolioImage[]
}

export type PortfolioData = {
  version: number
  updatedAt: string
  categories: PortfolioCategory[]
}
