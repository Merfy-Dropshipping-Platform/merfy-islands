import type { Product, StoreAPI } from "../services/store-api.js";
import { escapeHtml, formatPrice } from "../utils/format.js";

export interface PopularProductsProps {
  cards?: number;
  title?: string;
  subtitle?: string;
}

function isOutOfStock(product: Pick<Product, "quantity" | "hasVariants">): boolean {
  return product.quantity === 0 && !product.hasVariants;
}

function renderProductCard(product: {
  name: string;
  price: number;
  compareAtPrice?: number;
  images?: string[];
  slug?: string;
  quantity?: number;
  hasVariants?: boolean;
}): string {
  const name = escapeHtml(product.name);
  const image =
    product.images?.[0] ? escapeHtml(product.images[0]) : "/images/placeholder.png";
  const href = product.slug ? `/products/${escapeHtml(product.slug)}` : "#";
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
      <div class="relative bg-gray-100 rounded-lg sm:rounded-[8px] md:rounded-[10px] overflow-hidden w-full aspect-[318/515]">
        <img
          src="${image}"
          alt="${name}"
          loading="lazy"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        ${outOfStockOverlay}
      </div>
      <div class="flex flex-col gap-2 sm:gap-2.5 md:gap-3 lg:gap-[10px] px-2 sm:px-3 md:px-4 lg:px-[15px]">
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
}

export async function renderPopularProducts(
  props: PopularProductsProps,
  api: StoreAPI,
): Promise<string> {
  const limit = props.cards ?? 4;
  const title = props.title ? escapeHtml(props.title) : "&#1055;&#1086;&#1087;&#1091;&#1083;&#1103;&#1088;&#1085;&#1099;&#1077;";
  const subtitle = props.subtitle
    ? escapeHtml(props.subtitle)
    : "&#1057;&#1090;&#1080;&#1083;&#1100; &#1076;&#1083;&#1103; &#1082;&#1072;&#1078;&#1076;&#1086;&#1081; &#1089;&#1080;&#1090;&#1091;&#1072;&#1094;&#1080;&#1080; &mdash; &#1085;&#1072;&#1081;&#1076;&#1080;&#1090;&#1077; &#1089;&#1074;&#1086;&#1081; &#1074; &#1082;&#1072;&#1090;&#1072;&#1083;&#1086;&#1075;&#1077;.";

  const products = await api.getProducts({ limit });

  if (products.length === 0) {
    return `<section class="bg-white w-full py-8"><p class="text-center text-gray-400">No products found</p></section>`;
  }

  const cols =
    limit <= 2 ? "sm:grid-cols-2" : limit === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";

  return `
<section id="popular" class="bg-white w-full scroll-mt-20 py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-[100px]">
  <div class="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[300px]">
    <div class="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 lg:gap-[5px] mb-8 sm:mb-10 md:mb-12 lg:mb-16 xl:mb-20">
      <h2 class="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-normal text-black uppercase leading-[1.115] text-center" style="font-family: 'Comfortaa', sans-serif;">
        ${title}
      </h2>
      <p class="text-sm sm:text-base md:text-lg lg:text-xl xl:text-[24px] font-normal text-gray leading-[1.366] text-center px-2 sm:px-4" style="font-family: 'Manrope', sans-serif;">
        ${subtitle}
      </p>
    </div>
    <div class="grid grid-cols-1 ${cols} gap-4 sm:gap-5 md:gap-6 lg:gap-4 xl:gap-[16px]">
      ${products.map(renderProductCard).join("\n")}
    </div>
  </div>
</section>`;
}
