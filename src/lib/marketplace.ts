import type { Category, Product, Store, User } from "@/types/marketplace";

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
