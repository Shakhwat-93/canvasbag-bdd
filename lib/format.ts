export function toBanglaDigits(num: number | string): string {
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (digit) => banglaDigits[Number(digit)]);
}

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `৳${formatted}`;
}
export const formatBDT = formatCurrency;

export function validateBangladeshiPhone(phone: string): boolean {
  const cleaned = phone.trim().replace(/\D/g, "");
  return /^01[0-9]{9}$/.test(cleaned);
}
export const isValidBDPhone = validateBangladeshiPhone;

export function calculateOrderTotals(
  items: Array<{ price: number; quantity: number }>,
  shippingZone: "Inside Dhaka" | "Outside Dhaka" | string,
  shippingInsideRate: number = 70,
  shippingOutsideRate: number = 150
) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 1), 0);
  
  // Subtotal >= 3200 gets 250 discount
  const discount = subtotal >= 3200 ? 250 : 0;

  // Subtotal >= 2500 gets free delivery
  const isInside = shippingZone.toLowerCase().includes("inside");
  const baseShipping = isInside ? shippingInsideRate : shippingOutsideRate;
  const deliveryFee = subtotal >= 2500 || subtotal === 0 ? 0 : baseShipping;

  const total = Math.max(subtotal + deliveryFee - discount, 0);

  return {
    subtotal,
    deliveryFee,
    discount,
    total,
    isFreeShipping: deliveryFee === 0 && subtotal > 0,
  };
}

export function isValidImageUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return false;
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/")
  );
}

export function sanitizeImageUrl(url: unknown, fallback = "/brand/logo.webp"): string {
  return isValidImageUrl(url) ? (url as string).trim() : fallback;
}