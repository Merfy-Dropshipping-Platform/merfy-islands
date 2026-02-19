import type { StoreAPI } from "../services/store-api.js";
import { renderPopularProducts } from "./popular-products.js";
import { renderProductGrid } from "./product-grid.js";
import { renderProductDetail } from "./product-detail.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RendererFn = (props: any, api: StoreAPI) => Promise<string>;

export const rendererRegistry: Record<string, RendererFn> = {
  PopularProducts: renderPopularProducts,
  ProductGrid: renderProductGrid,
  ProductDetail: renderProductDetail,
};
