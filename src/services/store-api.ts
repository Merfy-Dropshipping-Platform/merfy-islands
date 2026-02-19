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

      const json = (await res.json()) as { data?: Product[] };
      return json.data ?? [];
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

      const json = (await res.json()) as { data?: Product };
      return json.data ?? null;
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

      const json = (await res.json()) as { data?: Collection[] };
      return json.data ?? [];
    } catch {
      return [];
    }
  }
}
