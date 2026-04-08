import type { Category, Product, Store, User } from "@/types/marketplace";

export type ProductSortOption =
  | "recent"
  | "name-asc"
  | "price-asc"
  | "price-desc";

export function getMarketplaceContext(user?: User | null) {
  return {
    tenantId: user?.tenant_id ?? "",
    partnerId: user?.partner_id ?? "",
    entityType: user?.entity_type ?? "hardware_store",
  };
}

export function resolveManagedStore(stores: Store[], user?: User | null) {
  if (!user) return null;

  return (
    stores.find((store) => store.id === user.partner_id) ??
    stores.find(
      (store) =>
        Boolean(user.email) &&
        Boolean(store.email) &&
        store.email?.trim().toLowerCase() === user.email.trim().toLowerCase(),
    ) ??
    null
  );
}

export function getStoreAddress(store?: Partial<Store> | null) {
  if (!store) return "Sin dirección registrada";

  return [store.street, store.city, store.state, store.country]
    .filter(Boolean)
    .join(", ") || "Sin dirección registrada";
}

export function getStoreStatusLabel(store?: Partial<Store> | null) {
  const status = store?.x_verification_status ?? "draft";

  switch (status) {
    case "verified":
      return "Verificada";
    case "published":
      return "Publicada";
    case "approved":
      return "Aprobada";
    default:
      return "Borrador";
  }
}

export function getDefaultListingType(entityType?: string) {
  return entityType === "hardware_store" ? "product" : "service";
}

export function getDefaultProductType(entityType?: string) {
  return entityType === "hardware_store" ? "product" : "service";
}

export function getProductStock(product?: Partial<Product> | null) {
  const explicitStock = product?.x_attributes_json?.stock;

  if (typeof explicitStock === "number") {
    return explicitStock;
  }

  if (typeof explicitStock === "string") {
    const parsed = Number.parseFloat(explicitStock);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const quants = product?.stock_quants ?? [];
  return quants.reduce((acc, quant) => acc + Number.parseFloat(quant.quantity ?? "0"), 0);
}

export function getProductSku(product?: Partial<Product> | null) {
  const sku = product?.x_attributes_json?.sku;
  if (typeof sku === "string" && sku.trim()) {
    return sku;
  }

  return product?.default_code ?? "Sin SKU";
}

export function filterStoreProducts(products: Product[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return products;

  return products.filter((product) =>
    [product.name, product.description_sale, product.slug, getProductSku(product)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalized)),
  );
}

export function filterCategories(categories: Category[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return categories;

  return categories.filter((category) => category.name.toLowerCase().includes(normalized));
}

export function getStoreTypeLabel(entityType?: string | null) {
  switch (entityType) {
    case "contractor":
      return "Contratista";
    case "education_provider":
      return "Educación";
    case "hardware_store":
      return "Ferretería";
    case "professional_firm":
      return "Firma profesional";
    case "seo_agency":
      return "Agencia SEO";
    default:
      return "Marketplace";
  }
}

export function getPrimaryProductImage(product?: Partial<Product> | null) {
  const cover = product?.cover_image_url;
  if (cover) return cover;

  const firstGallery = Array.isArray(product?.images) ? product.images[0]?.image_url : undefined;
  if (firstGallery) return firstGallery;

  const galleryImages = Array.isArray(product?.x_attributes_json?.gallery_images)
    ? product?.x_attributes_json?.gallery_images
    : [];

  const firstFromAttributes = galleryImages.find((image): image is string => typeof image === "string");
  return firstFromAttributes ?? null;
}

export function getStoreCityLabel(store?: Partial<Store> | null) {
  return [store?.city, store?.country].filter(Boolean).join(", ") || "Cobertura nacional";
}

export function getProductShortMeta(product?: Partial<Product> | null) {
  const pieces = [product?.listing_type, product?.vertical_type].filter(Boolean);
  return pieces.join(" · ") || "Producto publicado";
}

export function clampText(value?: string | null, max = 140) {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max).trim()}...` : value;
}

export function sortPublicProducts(products: Product[], sort: ProductSortOption) {
  const sorted = [...products];

  switch (sort) {
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
      break;
    case "price-asc":
      sorted.sort(
        (a, b) =>
          Number.parseFloat(String(a.list_price ?? 0)) - Number.parseFloat(String(b.list_price ?? 0)),
      );
      break;
    case "price-desc":
      sorted.sort(
        (a, b) =>
          Number.parseFloat(String(b.list_price ?? 0)) - Number.parseFloat(String(a.list_price ?? 0)),
      );
      break;
    case "recent":
    default:
      sorted.sort(
        (a, b) =>
          new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
          new Date(a.updated_at ?? a.created_at ?? 0).getTime(),
      );
      break;
  }

  return sorted;
}
