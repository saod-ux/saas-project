import { prisma } from '@/lib/db'

function transliterateArabicToLatin(input: string): string {
	const map: Record<string, string> = {
		'ا':'a','أ':'a','إ':'i','آ':'a','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h','خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'a','ة':'h','ؤ':'w','ئ':'y'
	}
	return input.split('').map(ch => map[ch] ?? ch).join('')
}

export function slugifyBase(value: string): string {
	if (!value) return ''
	let s = transliterateArabicToLatin(value)
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
	s = s.toLowerCase()
	s = s.replace(/[^a-z0-9\s-]/g, '')
	s = s.trim().replace(/\s+/g, '-')
	s = s.replace(/-+/g, '-')
	return s || 'category'
}

export async function slugifyUnique(name: string, tenantId: string, currentId?: string | null): Promise<string> {
	const base = slugifyBase(name)
	let candidate = base
	let i = 1
	while (true) {
		const existing = await prisma.category.findFirst({ where: { tenantId, slug: candidate } })
		if (!existing || (currentId && existing.id === currentId)) return candidate
		candidate = `${base}-${i++}`
	}
}





