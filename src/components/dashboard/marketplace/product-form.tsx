"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nativeSelectClassName } from "@/lib/bim";
import { getDefaultListingType, getDefaultProductType } from "@/lib/marketplace";
import type { Category, Product } from "@/types/marketplace";

const productSchema = z.object({
  categ_id: z.string().optional(),
  listing_type: z.enum(["service", "course", "product", "package"]),
  vertical_type: z.enum([
    "contractor",
    "education_provider",
    "hardware_store",
    "professional_firm",
    "seo_agency",
  ]),
  name: z.string().trim().min(1, "El nombre es requerido"),
  description_sale: z.string().trim().optional(),
  list_price: z.string().min(1, "El precio es requerido"),
  currency_code: z.string().trim().min(1, "La moneda es requerida"),
  type: z.enum(["service", "product"]),
  cover_image_url: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  stock: z.string().optional(),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  service_type: z.string().trim().optional(),
  delivery_mode: z.string().trim().optional(),
});

type ProductFormValues = z.input<typeof productSchema>;

function optionalValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getDefaultValues(initialData: Partial<Product> | undefined, entityType: string): ProductFormValues {
  return {
    categ_id: initialData?.categ_id ?? "",
    listing_type: (initialData?.listing_type as ProductFormValues["listing_type"]) ?? getDefaultListingType(entityType) as ProductFormValues["listing_type"],
    vertical_type: (initialData?.vertical_type as ProductFormValues["vertical_type"]) ?? entityType as ProductFormValues["vertical_type"],
    name: initialData?.name ?? "",
    description_sale: initialData?.description_sale ?? "",
    list_price: initialData?.list_price ?? "0",
    currency_code: initialData?.currency_code ?? "USD",
    type: (initialData?.type as ProductFormValues["type"]) ?? getDefaultProductType(entityType) as ProductFormValues["type"],
    cover_image_url: initialData?.cover_image_url ?? "",
    sku: typeof initialData?.x_attributes_json?.sku === "string" ? initialData.x_attributes_json.sku : "",
    stock: String(initialData?.x_attributes_json?.stock ?? 0),
    brand: typeof initialData?.extension?.brand === "string" ? initialData.extension.brand : "",
    model: typeof initialData?.extension?.model === "string" ? initialData.extension.model : "",
    service_type: typeof initialData?.extension?.service_type === "string" ? initialData.extension.service_type : "",
    delivery_mode: typeof initialData?.extension?.delivery_mode === "string" ? initialData.extension.delivery_mode : "",
  };
}

interface ProductFormProps {
  mode: "create" | "edit";
  entityType: string;
  categories: Category[];
  initialData?: Partial<Product>;
  isSubmitting?: boolean;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
}

export function ProductForm({
  mode,
  entityType,
  categories,
  initialData,
  isSubmitting = false,
  onSubmit,
}: ProductFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getDefaultValues(initialData, entityType),
  });

  useEffect(() => {
    reset(getDefaultValues(initialData, entityType));
  }, [entityType, initialData, reset]);

  const verticalType = useWatch({ control, name: "vertical_type" });

  async function submit(values: ProductFormValues) {
    await onSubmit({
      categ_id: optionalValue(values.categ_id),
      listing_type: values.listing_type,
      vertical_type: values.vertical_type,
      name: values.name.trim(),
      description_sale: optionalValue(values.description_sale),
      list_price: Number.parseFloat(values.list_price),
      currency_code: values.currency_code.trim().toUpperCase(),
      type: values.type,
      cover_image_url: optionalValue(values.cover_image_url),
      x_attributes_json: {
        sku: optionalValue(values.sku),
        stock: Number.parseFloat(values.stock || "0") || 0,
      },
      ...(values.vertical_type === "hardware_store"
        ? {
            brand: optionalValue(values.brand),
            model: optionalValue(values.model),
          }
        : {
            service_type: optionalValue(values.service_type),
            delivery_mode: optionalValue(values.delivery_mode),
          }),
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="product-name">Nombre</Label>
          <Input id="product-name" placeholder="Servicio de instalación" {...register("name")} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="product-category">Categoría</Label>
          <select id="product-category" className={nativeSelectClassName} {...register("categ_id")}>
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="product-listing">Tipo de listing</Label>
          <select id="product-listing" className={nativeSelectClassName} {...register("listing_type")}>
            <option value="service">Servicio</option>
            <option value="course">Curso</option>
            <option value="product">Producto</option>
            <option value="package">Paquete</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="product-type">Tipo base</Label>
          <select id="product-type" className={nativeSelectClassName} {...register("type")}>
            <option value="service">Servicio</option>
            <option value="product">Producto</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="product-price">Precio</Label>
          <Input id="product-price" type="number" step="0.01" min="0" {...register("list_price")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="product-currency">Moneda</Label>
          <Input id="product-currency" maxLength={3} placeholder="USD" {...register("currency_code")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="product-sku">SKU</Label>
          <Input id="product-sku" placeholder="SKU-001" {...register("sku")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="product-stock">Stock</Label>
          <Input id="product-stock" type="number" min="0" step="1" {...register("stock")} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="product-image">Imagen principal URL</Label>
          <Input id="product-image" placeholder="https://..." {...register("cover_image_url")} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="product-description">Descripción</Label>
          <Textarea id="product-description" placeholder="Describe el producto o servicio" {...register("description_sale")} />
        </div>
      </div>

      {verticalType === "hardware_store" ? (
        <div className="rounded-xl border bg-zinc-50 p-4">
          <p className="mb-3 text-sm font-medium text-zinc-900">Ficha de producto ferretero</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="product-brand">Marca</Label>
              <Input id="product-brand" placeholder="Bosch" {...register("brand")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-model">Modelo</Label>
              <Input id="product-model" placeholder="GBH 2-26" {...register("model")} />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-zinc-50 p-4">
          <p className="mb-3 text-sm font-medium text-zinc-900">Ficha de servicio</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="product-service-type">Tipo de servicio</Label>
              <Input id="product-service-type" placeholder="Instalación" {...register("service_type")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-delivery">Modo de entrega</Label>
              <Input id="product-delivery" placeholder="on_site" {...register("delivery_mode")} />
            </div>
          </div>
        </div>
      )}

      <input type="hidden" {...register("vertical_type")} />

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "create"
              ? "Creando..."
              : "Guardando..."
            : mode === "create"
              ? "Crear producto"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
