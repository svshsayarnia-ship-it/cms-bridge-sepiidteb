export type CmsCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  image: CmsImage | null;
  count: number;
};

export type CmsCategoryInput = {
  name: string;
  slug: string;
  description: string;
  image: CmsImage | null;
};

export type CmsImage = {
  id: number;
  src: string;
  name: string;
  alt: string;
};

export type CmsBrand = {
  id: number;
  name: string;
  slug: string;
};

export type CmsProduct = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: string;
  status: "draft" | "pending" | "private" | "publish";
  catalogVisibility: "visible" | "catalog" | "search" | "hidden";
  featured: boolean;
  description: string;
  shortDescription: string;
  seoTitle: string;
metaDescription: string;
focusKeyword: string;

sourceName: string;
sourceUrl: string;

reviewerName: string;
reviewerRole: string;
reviewedAt: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  manageStock: boolean;
  stockQuantity: number | null;
  stockStatus: "instock" | "outofstock" | "onbackorder";
  categories: Array<{ id: number; name: string; slug: string }>;
  brands: CmsBrand[];
  images: CmsImage[];
  permalink: string;
  dateModifiedGmt: string;
};

export type CmsProductInput = Omit<
  CmsProduct,
  "id" | "price" | "type" | "permalink" | "dateModifiedGmt" | "categories" | "brands"
> & {
  id?: number;
  categoryIds: number[];
  expectedModifiedGmt?: string;
};

export type CmsProductsResponse = {
  products: CmsProduct[];
  page: number;
  total: number;
  totalPages: number;
};

export type CmsConnectionStatus = {
  connected: boolean;
  storeUrl: string;
  productCount: number | null;
  bridgeVersion: string | null;
  mediaUploadReady: boolean;
  message?: string;
  code?: string;
};
