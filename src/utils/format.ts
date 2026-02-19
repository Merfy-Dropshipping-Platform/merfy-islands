const priceFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

export function formatPrice(value: number | undefined | null): string {
  if (value == null) return "0 ₽";
  return priceFormatter.format(value) + " ₽";
}

const htmlEscapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => htmlEscapeMap[ch]!);
}
