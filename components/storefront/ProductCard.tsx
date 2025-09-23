interface Product {
  id: string
  title: string
  description: string | null
  price: string
  currency: string
  stock: number
  status: string
  imageUrl: string | null
  categories: {
    id: string
    name: string
    slug: string
  } | null
}

import ThumbCard from '@/components/ui/ThumbCard'
import { formatMoney } from '@/lib/formatPrice'

interface ProductCardProps {
  product: Product
  tenantLogoUrl?: string | null
  locale?: string
}

export function ProductCard({ product, tenantLogoUrl, locale = 'en-US' }: ProductCardProps) {
  return (
    <div className="card p-4 hover:shadow-lg transition-shadow duration-200">
      {/* Product Image */}
      <div className="mb-4 rounded-lg overflow-hidden">
        <ThumbCard
          src={product.imageUrl}
          alt={product.title}
          fallbackSrc={tenantLogoUrl}
          aspectRatio="square"
        />
      </div>

      {/* Category Badge */}
      {product.categories && (
        <div className="mb-2">
          <span className="badge">{product.categories.name}</span>
        </div>
      )}

      {/* Product Title */}
      <h3 className="font-semibold text-ink mb-2 line-clamp-2">{product.title}</h3>

      {/* Product Description */}
      {product.description && (
        <p className="text-sm text-muted mb-3 line-clamp-2">{product.description}</p>
      )}

      {/* Price and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-bold text-ink">
            {formatMoney(Number(product.price), product.currency, locale)}
          </span>
          <div className="text-xs text-muted">
            {product.stock} in stock
          </div>
        </div>
        <button className="btn btn-primary text-sm">
          Add
        </button>
      </div>
    </div>
  )
}