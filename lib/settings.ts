import { z } from 'zod'

// Storefront Theme Schema
export const storefrontThemeSchema = z.object({
  primary: z.string().default('#1F2937'),
  accent: z.string().default('#111827'),
  bg: z.string().default('#FAF7F2'),
  card: z.string().default('#FFFFFF'),
  text: z.string().default('#1F2937'),
  logoUrl: z.string().optional(),
})

// Hero Settings Schema
export const heroSettingsSchema = z.object({
  showHero: z.boolean().default(true),
  heroTitle: z.string().default('Welcome to Our Store'),
  heroSubtitle: z.string().default('Discover amazing products at great prices'),
  heroCtaLabel: z.string().default('Shop Now'),
  heroCtaHref: z.string().default('#products'),
  heroImageUrl: z.string().optional(),
})

// Localization Schema
export const localizationSchema = z.object({
  direction: z.enum(['ltr', 'rtl']).default('ltr'),
  locale: z.enum(['en-US', 'ar-KW']).default('en-US'),
})

// Social Links Schema
export const socialLinksSchema = z.object({
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  whatsapp: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().optional(),
})

// Contact Info Schema
export const contactInfoSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

// Branding Schema
export const brandingSchema = z.object({
  primaryColor: z.string().optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
})

// Categories Schema
export const categoriesSchema = z.object({
  enabled: z.boolean().default(true),
  items: z.array(z.string()).default([]),
})

// Payment Settings Schema
export const paymentSettingsSchema = z.object({
  myfatoorahApiKey: z.string().optional(),
  myfatoorahSecretKey: z.string().optional(),
  myfatoorahIsTest: z.boolean().default(true),
  knetMerchantId: z.string().optional(),
  knetApiKey: z.string().optional(),
  knetIsTest: z.boolean().default(true),
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  stripeIsTest: z.boolean().default(true),
})

// Main Settings Schema
export const tenantSettingsSchema = z.object({
  // Basic Info
  storeName: z.string().default(''),
  description: z.string().default(''),
  
  // Storefront Settings
  storefront: z.object({
    theme: storefrontThemeSchema,
    hero: heroSettingsSchema,
    localization: localizationSchema,
  }).default({
    theme: storefrontThemeSchema.parse({}),
    hero: heroSettingsSchema.parse({}),
    localization: localizationSchema.parse({}),
  }),
  
  // Other Settings
  social: socialLinksSchema.default({}),
  contactInfo: contactInfoSchema.default({}),
  branding: brandingSchema.default({}),
  categories: categoriesSchema.default({}),
  payment: paymentSettingsSchema.default({}),
  
  // Version
  settingsVersion: z.number().default(1),
})

// Default settings
export const defaultSettings = tenantSettingsSchema.parse({})

// Type for settings
export type TenantSettings = z.infer<typeof tenantSettingsSchema>

// Upgrade settings to latest version
export function upgradeSettings(currentSettings: any): TenantSettings {
  const version = currentSettings.settingsVersion || 0
  
  if (version < 1) {
    // Migrate from old format to new format
    return tenantSettingsSchema.parse({
      storeName: currentSettings.storeName || '',
      description: currentSettings.description || '',
      storefront: {
        theme: {
          primary: currentSettings.primary || '#1F2937',
          accent: currentSettings.accent || '#111827',
          bg: currentSettings.bg || '#FAF7F2',
          card: currentSettings.card || '#FFFFFF',
          text: currentSettings.text || '#1F2937',
          logoUrl: currentSettings.logoUrl,
        },
        hero: {
          showHero: currentSettings.showHero ?? true,
          heroTitle: currentSettings.heroTitle || 'Welcome to Our Store',
          heroSubtitle: currentSettings.heroSubtitle || 'Discover amazing products at great prices',
          heroCtaLabel: currentSettings.heroCtaLabel || 'Shop Now',
          heroCtaHref: currentSettings.heroCtaHref || '#products',
          heroImageUrl: currentSettings.heroImageUrl,
        },
        localization: {
          direction: currentSettings.direction || 'ltr',
          locale: currentSettings.locale || 'en-US',
        },
      },
      social: currentSettings.socialLinks || {},
      contactInfo: currentSettings.contactInfo || {},
      branding: currentSettings.branding || {},
      categories: {
        enabled: true,
        items: currentSettings.categories || [],
      },
      payment: {
        myfatoorahApiKey: currentSettings.myfatoorahApiKey || '',
        myfatoorahSecretKey: currentSettings.myfatoorahSecretKey || '',
        myfatoorahIsTest: currentSettings.myfatoorahIsTest ?? true,
        knetMerchantId: currentSettings.knetMerchantId || '',
        knetApiKey: currentSettings.knetApiKey || '',
        knetIsTest: currentSettings.knetIsTest ?? true,
        stripePublishableKey: currentSettings.stripePublishableKey || '',
        stripeSecretKey: currentSettings.stripeSecretKey || '',
        stripeIsTest: currentSettings.stripeIsTest ?? true,
      },
      settingsVersion: 1,
    })
  }
  
  // Already at latest version, just validate
  return tenantSettingsSchema.parse(currentSettings)
}

// Extract storefront settings for components
export function getStorefrontSettings(settings: TenantSettings) {
  return {
    theme: settings.storefront.theme,
    hero: settings.storefront.hero,
    localization: settings.storefront.localization,
    storeName: settings.storeName,
    description: settings.description,
    social: settings.social,
    categories: settings.categories.items,
  }
}
