import { getTenantDocuments, createDocument } from "@/lib/db";

export async function provisionDefaultPages(tenantId: string, lang: 'en' | 'ar') {
  const pages = [
    {
      slug: 'about',
      title: lang === 'ar' ? 'حولنا' : 'About Us',
      content: lang === 'ar' 
        ? 'نحن متجر متخصص في تقديم أفضل المنتجات لعملائنا. نسعى دائماً لتوفير تجربة تسوق مميزة.'
        : 'We are a specialized store committed to providing the best products to our customers. We always strive to provide an exceptional shopping experience.',
      published: true,
    },
    {
      slug: 'faq',
      title: lang === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions',
      content: lang === 'ar'
        ? 'هنا ستجد إجابات على الأسئلة الأكثر شيوعاً حول منتجاتنا وخدماتنا.'
        : 'Here you will find answers to the most common questions about our products and services.',
      published: true,
    },
    {
      slug: 'privacy',
      title: lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy',
      content: lang === 'ar'
        ? 'نحن نحترم خصوصيتك ونلتزم بحماية معلوماتك الشخصية وفقاً لأعلى المعايير الأمنية.'
        : 'We respect your privacy and are committed to protecting your personal information according to the highest security standards.',
      published: true,
    },
  ];

  const results = [];
  
  for (const pageData of pages) {
    try {
      // Check if page already exists
      const existingPages = await getTenantDocuments('pages', tenantId);
      const existingPage = existingPages.find((p: any) => p.slug === pageData.slug);

      if (existingPage) {
        console.log(`Page ${pageData.slug} already exists for tenant ${tenantId}`);
        results.push({ slug: pageData.slug, status: 'exists' });
        continue;
      }

      // Create new page
      const page = await createDocument('pages', {
        tenantId,
        slug: pageData.slug,
        title: pageData.title,
        content: pageData.content,
        isPublished: pageData.published,
      });

      results.push({ slug: pageData.slug, status: 'created', id: page.id });
    } catch (error) {
      console.error(`Error creating page ${pageData.slug}:`, error);
      results.push({ slug: pageData.slug, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return results;
}

// Example usage in a script or API endpoint:
// const results = await provisionDefaultPages('tenant-id', 'en');
// console.log('Provisioning results:', results);
