import type { Product, StoreAPI } from "../services/store-api.js";
import { escapeHtml, formatPrice } from "../utils/format.js";

function isOutOfStock(product: Pick<Product, "quantity" | "hasVariants">): boolean {
  return product.quantity === 0 && !product.hasVariants;
}

export interface ProductGridProps {
  columns?: number;
  limit?: number;
  collectionId?: string;
  title?: string;
}

export async function renderProductGrid(
  props: ProductGridProps,
  api: StoreAPI,
): Promise<string> {
  const limit = props.limit ?? 12;
  const columns = props.columns ?? 4;
  const title = props.title ? escapeHtml(props.title) : "";

  const products = await api.getProducts({
    limit,
    collectionId: props.collectionId,
  });

  if (products.length === 0) {
    return `<section class="bg-white w-full py-8"><p class="text-center text-gray-400">No products found</p></section>`;
  }

  const colsClass =
    columns <= 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  const titleHtml = title
    ? `<h2 class="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-normal text-black uppercase leading-[1.115] text-center mb-8 sm:mb-10 md:mb-12" style="font-family: 'Comfortaa', sans-serif;">${title}</h2>`
    : "";

  const cards = products
    .map((product) => {
      const name = escapeHtml(product.name);
      const image =
        product.images?.[0]
          ? escapeHtml(product.images[0])
          : "/images/placeholder.png";
      const href = product.slug
        ? `/products/${escapeHtml(product.slug)}`
        : "#";
      const outOfStock = isOutOfStock({
        quantity: product.quantity ?? 0,
        hasVariants: product.hasVariants ?? false,
      });

      const outOfStockOverlay = outOfStock
        ? `<div class="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg sm:rounded-[8px] md:rounded-[10px]">
            <span class="text-white text-sm sm:text-base font-medium px-3 py-1.5 bg-black/60 rounded-md" style="font-family: 'Manrope', sans-serif;">Нет в наличии</span>
          </div>`
        : "";

      return `
      <a href="${href}" class="flex flex-col gap-4 sm:gap-5 md:gap-6 lg:gap-[25px] group cursor-pointer no-underline">
        <div class="relative w-full aspect-square lg:aspect-[400/400] bg-gray-100 rounded-lg sm:rounded-[8px] md:rounded-[10px] overflow-hidden">
          <img
            src="${image}"
            alt="${name}"
            loading="lazy"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          ${outOfStockOverlay}
        </div>
        <div class="flex flex-col gap-2 sm:gap-2.5 md:gap-3 lg:gap-[10px] px-2 sm:px-3 md:px-4">
          <h3 class="text-base sm:text-lg md:text-xl lg:text-[24px] font-normal text-black leading-[1.366]" style="font-family: 'Manrope', sans-serif;">
            ${name}
          </h3>
          <div class="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-[15px] flex-wrap">
            <span class="text-lg sm:text-xl md:text-2xl lg:text-[32px] font-normal text-black leading-[1.366]" style="font-family: 'Manrope', sans-serif;">
              ${formatPrice(product.price)}
            </span>
            ${
              product.compareAtPrice
                ? `<span class="text-sm sm:text-base md:text-lg lg:text-[20px] font-medium text-[#999999] line-through leading-[1.366]" style="font-family: 'Manrope', sans-serif;">
                    ${formatPrice(product.compareAtPrice)}
                  </span>`
                : ""
            }
          </div>
        </div>
      </a>`;
    })
    .join("\n");

  return `
<section class="bg-white w-full py-8 sm:py-12 md:py-16 lg:py-20">
  <div class="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[300px]">
    ${titleHtml}
    <div class="grid grid-cols-1 ${colsClass} gap-4 sm:gap-5 md:gap-6 lg:gap-4 xl:gap-[16px]">
      ${cards}
    </div>
  </div>
</section>`;
}
