export type PortfolioImage = {
  id: string
  url: string
  pathname?: string
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
