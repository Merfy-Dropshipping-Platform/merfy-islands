import type { StoreAPI } from "../services/store-api.js";
import { escapeHtml, formatPrice } from "../utils/format.js";

export interface ProductDetailProps {
  productId: string;
}

export async function renderProductDetail(
  props: ProductDetailProps,
  api: StoreAPI,
): Promise<string> {
  const product = await api.getProduct(props.productId);

  if (!product) {
    return `<section class="bg-white w-full py-8"><p class="text-center text-gray-400">Product not found</p></section>`;
  }

  const name = escapeHtml(product.name);
  const description = product.description
    ? escapeHtml(product.description)
    : "";
  const images = product.images ?? [];

  const galleryHtml =
    images.length > 0
      ? images
          .map(
            (img, i) => `
        <div class="${i === 0 ? "col-span-2 row-span-2" : ""} bg-gray-100 rounded-lg sm:rounded-[8px] md:rounded-[10px] overflow-hidden">
          <img
            src="${escapeHtml(img)}"
            alt="${name}"
            loading="${i === 0 ? "eager" : "lazy"}"
            class="w-full h-full object-cover"
          />
        </div>`,
          )
          .join("\n")
      : `<div class="col-span-2 row-span-2 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
           <span class="text-gray-400">No image</span>
         </div>`;

  const sku = product.sku;
  const outOfStock = product.quantity === 0 && !product.hasVariants;

  const skuHtml = sku
    ? `<p class="text-xs sm:text-sm text-gray-400 leading-normal" style="font-family: 'Manrope', sans-serif;">
        Артикул: ${escapeHtml(sku)}
      </p>`
    : "";

  const outOfStockHtml = outOfStock
    ? `<div class="inline-flex items-center px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
        <span class="text-sm sm:text-base font-medium text-red-600" style="font-family: 'Manrope', sans-serif;">Нет в наличии</span>
      </div>`
    : "";

  const buttonHtml = outOfStock
    ? `<button disabled class="w-full sm:w-auto px-8 py-3 sm:py-4 bg-gray-300 text-gray-500 rounded-lg text-base sm:text-lg font-medium cursor-not-allowed opacity-50" style="font-family: 'Manrope', sans-serif;">
        Add to cart
      </button>`
    : `<button class="w-full sm:w-auto px-8 py-3 sm:py-4 bg-black text-white rounded-lg text-base sm:text-lg font-medium hover:bg-gray-800 transition-colors" style="font-family: 'Manrope', sans-serif;">
        Add to cart
      </button>`;

  return `
<section class="bg-white w-full py-8 sm:py-12 md:py-16 lg:py-20">
  <div class="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[300px]">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <!-- Gallery -->
      <div class="grid grid-cols-2 gap-3 sm:gap-4">
        ${galleryHtml}
      </div>

      <!-- Details -->
      <div class="flex flex-col gap-6 sm:gap-8">
        <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-normal text-black leading-[1.115]" style="font-family: 'Comfortaa', sans-serif;">
          ${name}
        </h1>

        ${skuHtml}

        <div class="flex items-center gap-3 sm:gap-4 lg:gap-[15px] flex-wrap">
          <span class="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-normal text-black leading-[1.366]" style="font-family: 'Manrope', sans-serif;">
            ${formatPrice(product.price)}
          </span>
          ${
            product.compareAtPrice
              ? `<span class="text-lg sm:text-xl md:text-2xl lg:text-[24px] font-medium text-[#999999] line-through leading-[1.366]" style="font-family: 'Manrope', sans-serif;">
                  ${formatPrice(product.compareAtPrice)}
                </span>`
              : ""
          }
        </div>

        ${outOfStockHtml}

        ${
          description
            ? `<div class="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed" style="font-family: 'Manrope', sans-serif;">
                ${description}
              </div>`
            : ""
        }

        ${buttonHtml}
      </div>
    </div>
  </div>
</section>`;
}
