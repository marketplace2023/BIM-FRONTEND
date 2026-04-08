"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { productsApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { nativeSelectClassName } from "@/lib/bim";
import { getDefaultListingType, getDefaultProductType } from "@/lib/marketplace";
import type { Category, Product } from "@/types/marketplace";
import { toast } from "sonner";

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
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getDefaultValues(initialData, entityType),
  });

  useEffect(() => {
    reset(getDefaultValues(initialData, entityType));
  }, [entityType, initialData, reset]);

  const verticalType = useWatch({ control, name: "vertical_type" });
  const coverImageUrl = useWatch({ control, name: "cover_image_url" });
  const initialGallery = useMemo(
    () =>
      (initialData?.images ?? []).map((image) => image.image_url).filter(Boolean) as string[] ??
      [],
    [initialData?.images],
  );
  const [galleryImages, setGalleryImages] = useState<string[]>(initialGallery);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  useEffect(() => {
    setGalleryImages(initialGallery);
  }, [initialGallery]);

  async function handleImageUpload() {
    if (selectedFiles.length === 0) {
      toast.error("Selecciona al menos una imagen para subir");
      return;
    }

    try {
      setIsUploadingImages(true);
      const response = await productsApi.uploadImages(selectedFiles);
      const uploadedUrls = response.data.data.map((item) => item.url);
      setGalleryImages((current) => {
        const merged = [...current, ...uploadedUrls].filter(
          (value, index, array) => array.indexOf(value) === index,
        );

        if (!coverImageUrl && merged[0]) {
          setValue("cover_image_url", merged[0], { shouldDirty: true });
        }

        return merged;
      });
      setSelectedFiles([]);
      toast.success("Imágenes subidas correctamente");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudieron subir las imágenes"));
    } finally {
      setIsUploadingImages(false);
    }
  }

  function moveImage(imageUrl: string, direction: "left" | "right") {
    setGalleryImages((current) => {
      const index = current.indexOf(imageUrl);
      if (index === -1) return current;

      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

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
        gallery_images: galleryImages,
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

      <div className="rounded-xl border bg-zinc-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">Imágenes del producto</p>
              <p className="text-xs text-zinc-500">Sube varias imágenes y selecciona una como portada.</p>
            </div>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
            />
            <Button type="button" size="sm" variant="outline" onClick={handleImageUpload} disabled={isUploadingImages}>
              {isUploadingImages ? "Subiendo..." : "Subir imágenes"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {(galleryImages.length > 0 ? galleryImages : coverImageUrl ? [coverImageUrl] : []).map((imageUrl) => (
              <div key={imageUrl} className="rounded-xl border bg-white p-2">
                <Image src={imageUrl} alt="Imagen del producto" width={120} height={120} className="h-24 w-24 rounded-lg object-cover" unoptimized />
                <div className="mt-2 flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={coverImageUrl === imageUrl ? "default" : "outline"}
                    onClick={() => setValue("cover_image_url", imageUrl, { shouldDirty: true })}
                  >
                    {coverImageUrl === imageUrl ? "Portada" : "Usar portada"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => moveImage(imageUrl, "left")}
                    disabled={galleryImages.indexOf(imageUrl) <= 0}
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Subir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => moveImage(imageUrl, "right")}
                    disabled={galleryImages.indexOf(imageUrl) === -1 || galleryImages.indexOf(imageUrl) >= galleryImages.length - 1}
                  >
                    Bajar
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const next = galleryImages.filter((item) => item !== imageUrl);
                      setGalleryImages(next);
                      if (coverImageUrl === imageUrl) {
                        setValue("cover_image_url", next[0] ?? "", { shouldDirty: true });
                      }
                    }}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
