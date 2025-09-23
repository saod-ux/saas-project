'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Search, Menu, X } from 'lucide-react'
import { useTenantTheme } from '@/providers/TenantThemeProvider'
import { useLocale } from './providers/LocaleProvider'
import LanguageSwitcher from './LanguageSwitcher'

interface StorefrontHeaderProps {
  
  storeName: string
  logoUrl?: string
  cartCount: number
  onSearch: (term: string) => void
  onCartClick: () => void
  onCheckoutClick: () => void
  onRefresh?: () => void
}

export default function StorefrontHeader({
  storeName,
  logoUrl,
  cartCount,
  onSearch,
  onCartClick,
  onCheckoutClick,
  onRefresh
}: StorefrontHeaderProps) {
  const { theme } = useTenantTheme()
  const { locale, direction, t } = useLocale()
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, onSearch])

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white'
      }`}
      style={{ borderBottomColor: theme.primary + '20' }}
      dir={direction}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Store Name */}
          <div className="flex items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName}
                className="h-8 w-auto"
                style={{ maxWidth: '120px' }}
              />
            ) : (
              <h1 
                className="text-xl font-bold"
                style={{ color: theme.primary }}
              >
                {storeName}
              </h1>
            )}
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4`} />
              <Input
                type="text"
                placeholder={t('storefront.products.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={direction === 'rtl' ? 'pr-10' : 'pl-10'}
                style={{ 
                  backgroundColor: theme.card,
                  borderColor: theme.primary + '20',
                  color: theme.text
                }}
              />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                style={{ 
                  borderColor: theme.primary + '20',
                  color: theme.primary
                }}
              >
                🔄 {t('common.refresh')}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onCartClick}
              className="relative"
              style={{ 
                borderColor: theme.primary + '20',
                color: theme.text
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {t('navigation.cart')}
              {cartCount > 0 && (
                <span 
                  className="absolute -top-2 -right-2 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  style={{ backgroundColor: theme.accent }}
                >
                  {cartCount}
                </span>
              )}
            </Button>
            
            <Button
              onClick={onCheckoutClick}
              style={{ 
                backgroundColor: theme.primary,
                color: '#FFFFFF'
              }}
              className="hover:opacity-90"
            >
              {t('navigation.checkout')}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4`} />
            <Input
              type="text"
              placeholder={t('storefront.products.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={direction === 'rtl' ? 'pr-10' : 'pl-10'}
              style={{ 
                backgroundColor: theme.card,
                borderColor: theme.primary + '20',
                color: theme.text
              }}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4" style={{ borderColor: theme.primary + '20' }}>
            <div className="flex flex-col space-y-3">
              {/* Mobile Language Switcher */}
              <div className="flex justify-center pb-2">
                <LanguageSwitcher />
              </div>
              
              <Button
                variant="outline"
                onClick={onCartClick}
                className="relative justify-start"
                style={{ 
                  borderColor: theme.primary + '20',
                  color: theme.text
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t('navigation.cart')}
                {cartCount > 0 && (
                  <span 
                    className="ml-auto text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                    style={{ backgroundColor: theme.accent }}
                  >
                    {cartCount}
                  </span>
                )}
              </Button>
              
              <Button
                onClick={onCheckoutClick}
                className="justify-start"
                style={{ 
                  backgroundColor: theme.primary,
                  color: '#FFFFFF'
                }}
              >
                {t('navigation.checkout')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
