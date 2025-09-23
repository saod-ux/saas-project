// Helper functions to normalize Prisma Decimal to numbers
export const toNum = (d: any) => (d && typeof d === "object" && "toNumber" in d ? d.toNumber() : d);
export const money = (d: any) => Number(toNum(d) ?? 0);


