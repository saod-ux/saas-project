export const t = {
  // navbar / hero
  storeSearch: "ابحث",
  welcomeHeadline: "مرحبًا بكم في متجرنا",
  welcomeSub: "اكتشفوا منتجات رائعة",

  // sections
  shopByCategory: "تسوق حسب القسم",
  allCategories: "جميع الأقسام",

  // product card
  buyNow: "اشتري الآن",
  add: "أضف +",
  prepTime: "وقت التحضير التقديري",

  // bottom bar
  home: "الرئيسية",
  cart: "السلة",
  more: "المزيد",

  // more sheet
  contact: "اتصل بنا",
  about: "من نحن",
  faq: "الأسئلة الشائعة",

  // empty states
  noProducts: "لا توجد منتجات في هذا القسم حتى الآن.",
  searchPlaceholder: "ابحث عن المنتجات...",
  resultsFor: (q: string, n: number) => `نتائج البحث عن "${q}" — ${n} نتيجة`,

  // Cart
  cartTitle: "سلة التسوق",
  cartEmpty: "سلتك فارغة",
  continueShopping: "متابعة التسوق",
  checkout: "إتمام الطلب",
  subtotal: "المجموع الفرعي",
  total: "الإجمالي",
  quantity: "الكمية",
  remove: "إزالة",
  item: "منتج",
  items: "منتجات",
};

export function formatKWD(value: number | string) {
  const v = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("ar-KW", { 
    style: "currency", 
    currency: "KWD", 
    minimumFractionDigits: 3 
  }).format(v);
}
