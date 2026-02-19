export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images?: string[];
  slug?: string;
  [key: string]: unknown;
}

export interface Collection {
  id: string;
  name: string;
  slug?: string;
}

/** Raw product shape from the gateway API */
interface RawProduct {
  id: string;
  title: string;
  description?: string;
  basePrice: string | number;
  compareAtPrice?: string | number | null;
  images?: string[];
  handle?: string;
  slug?: string;
  [key: string]: unknown;
}

function mapProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    name: raw.title,
    description: raw.description,
    price: typeof raw.basePrice === "string" ? parseFloat(raw.basePrice) : raw.basePrice,
    compareAtPrice: raw.compareAtPrice
      ? typeof raw.compareAtPrice === "string"
        ? parseFloat(raw.compareAtPrice)
        : raw.compareAtPrice
      : undefined,
    images: raw.images,
    slug: raw.handle || raw.slug || raw.id,
  };
}

export class StoreAPI {
  constructor(
    private readonly baseUrl: string,
    private readonly storeId: string,
  ) {}

  async getProducts(opts?: {
    limit?: number;
    collectionId?: string;
  }): Promise<Product[]> {
    try {
      const params = new URLSearchParams({ store_id: this.storeId });
      if (opts?.limit) params.set("limit", String(opts.limit));
      if (opts?.collectionId)
        params.set("collection_id", opts.collectionId);

      const res = await fetch(
        `${this.baseUrl}/store/products?${params.toString()}`,
      );
      if (!res.ok) return [];

      const json = (await res.json()) as { products?: RawProduct[]; data?: RawProduct[] };
      const raw = json.products ?? json.data ?? [];
      return raw.map(mapProduct);
    } catch {
      return [];
    }
  }

  async getProduct(idOrHandle: string): Promise<Product | null> {
    try {
      const params = new URLSearchParams({ store_id: this.storeId });
      const res = await fetch(
        `${this.baseUrl}/store/products/${encodeURIComponent(idOrHandle)}?${params.toString()}`,
      );
      if (!res.ok) return null;

      const json = (await res.json()) as { product?: RawProduct; data?: RawProduct };
      const raw = json.product ?? json.data ?? null;
      return raw ? mapProduct(raw) : null;
    } catch {
      return null;
    }
  }

  async getCollections(): Promise<Collection[]> {
    try {
      const params = new URLSearchParams({ store_id: this.storeId });
      const res = await fetch(
        `${this.baseUrl}/store/collections?${params.toString()}`,
      );
      if (!res.ok) return [];

      const json = (await res.json()) as { collections?: Collection[]; data?: Collection[] };
      return json.collections ?? json.data ?? [];
    } catch {
      return [];
    }
  }
}
