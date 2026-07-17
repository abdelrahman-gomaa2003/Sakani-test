export function formatPrice(price) {
  return Number(price).toLocaleString("ar-SA");
}

export function formatPriceWithCurrency(price) {
  return `${formatPrice(price)} ر.س`;
}
