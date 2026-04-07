export interface User {
  id: string;
  name?: string;
  username?: string;
  email: string;
  phone?: string;
  role: string;
  roles?: string[];
  entity_type?: string;
  tenant_id?: string;
  partner_id?: string;
  is_active?: boolean | number;
  created_at?: string;
}

export interface StoreProfile {
  [key: string]: unknown;
}

export interface Store {
  id: string;
  tenant_id?: string;
  entity_type: string;
  name: string;
  legal_name?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  description?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
  partner_latitude?: string | null;
  partner_longitude?: string | null;
  x_verification_status?: string;
  attributes_json?: Record<string, unknown> | null;
  profile?: StoreProfile | null;
  rating_avg?: string;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  tenant_id?: string;
  parent_id?: string | null;
  vertical?: string | null;
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id: string;
  image_url: string;
  file_name?: string | null;
  original_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  sort_order?: number;
  is_cover?: number;
}

export interface ProductVariant {
  id: string;
  sku?: string | null;
  barcode?: string | null;
  active?: number;
}

export interface StockQuant {
  id: string;
  product_variant_id: string;
  location_code?: string;
  quantity?: string;
  reserved_quantity?: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  partner_id: string;
  categ_id?: string | null;
  listing_type: string;
  vertical_type: string;
  name: string;
  slug?: string;
  description_sale?: string | null;
  list_price: string;
  compare_price?: string | null;
  currency_code: string;
  type: string;
  default_code?: string | null;
  x_attributes_json?: Record<string, unknown> | null;
  seo_json?: Record<string, unknown> | null;
  cta_json?: Record<string, unknown> | null;
  cover_image_url?: string | null;
  rating_avg?: string;
  is_published: number;
  active: number;
  extension?: Record<string, unknown> | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  stock_quants?: StockQuant[];
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  code?: string;
  status: string;
  total?: string | number;
  created_at?: string;
}

export interface StorePaymentMethod {
  id: string;
  store_id: string;
  type: string;
  details?: string;
  is_active?: boolean | number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
