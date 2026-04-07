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
import { getMarketplaceContext } from "@/lib/marketplace";
import type { Store, User } from "@/types/marketplace";

const storeSchema = z.object({
  entity_type: z.enum([
    "contractor",
    "education_provider",
    "hardware_store",
    "professional_firm",
    "seo_agency",
  ]),
  name: z.string().trim().min(1, "El nombre es requerido"),
  legal_name: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  website: z.string().trim().optional(),
  description: z.string().trim().optional(),
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  pickup_available: z.boolean().default(false),
  b2b_enabled: z.boolean().default(false),
  heavy_logistics_enabled: z.boolean().default(false),
  warehouse_count: z.string().optional(),
  service_area_type: z.string().trim().optional(),
  coverage_radius_km: z.string().optional(),
  firm_type: z.string().trim().optional(),
  license_registry: z.string().trim().optional(),
});

type StoreFormValues = z.input<typeof storeSchema>;

function optionalValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getDefaultValues(initialData?: Partial<Store>, user?: User | null): StoreFormValues {
  const entityType = initialData?.entity_type ?? getMarketplaceContext(user).entityType;
  const profile = initialData?.profile as Record<string, unknown> | undefined;

  return {
    entity_type: entityType as StoreFormValues["entity_type"],
    name: initialData?.name ?? "",
    legal_name: initialData?.legal_name ?? "",
    email: initialData?.email ?? user?.email ?? "",
    phone: initialData?.phone ?? user?.phone ?? "",
    website: initialData?.website ?? "",
    description: initialData?.description ?? "",
    street: initialData?.street ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    country: initialData?.country ?? "",
    zip: initialData?.zip ?? "",
    pickup_available: Boolean(profile?.pickup_available),
    b2b_enabled: Boolean(profile?.b2b_enabled),
    heavy_logistics_enabled: Boolean(profile?.heavy_logistics_enabled),
    warehouse_count: String(profile?.warehouse_count ?? 0),
    service_area_type: String(profile?.service_area_type ?? ""),
    coverage_radius_km: String(profile?.coverage_radius_km ?? ""),
    firm_type: String(profile?.firm_type ?? ""),
    license_registry: String(profile?.license_registry ?? ""),
  };
}

interface StoreFormProps {
  mode: "create" | "edit";
  initialData?: Partial<Store>;
  currentUser?: User | null;
  isSubmitting?: boolean;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
}

export function StoreForm({
  mode,
  initialData,
  currentUser,
  isSubmitting = false,
  onSubmit,
}: StoreFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: getDefaultValues(initialData, currentUser),
  });

  useEffect(() => {
    reset(getDefaultValues(initialData, currentUser));
  }, [currentUser, initialData, reset]);

  const entityType = useWatch({ control, name: "entity_type" });

  async function submit(values: StoreFormValues) {
    await onSubmit({
      entity_type: values.entity_type,
      name: values.name.trim(),
      legal_name: optionalValue(values.legal_name),
      email: optionalValue(values.email),
      phone: optionalValue(values.phone),
      website: optionalValue(values.website),
      description: optionalValue(values.description),
      street: optionalValue(values.street),
      city: optionalValue(values.city),
      state: optionalValue(values.state),
      country: optionalValue(values.country),
      zip: optionalValue(values.zip),
      ...(values.entity_type === "hardware_store"
        ? {
            pickup_available: values.pickup_available,
            b2b_enabled: values.b2b_enabled,
            heavy_logistics_enabled: values.heavy_logistics_enabled,
            warehouse_count: Number.parseInt(values.warehouse_count || "0", 10) || 0,
          }
        : {}),
      ...(values.entity_type === "contractor"
        ? {
            service_area_type: optionalValue(values.service_area_type),
            coverage_radius_km: values.coverage_radius_km
              ? Number.parseFloat(values.coverage_radius_km)
              : undefined,
          }
        : {}),
      ...(values.entity_type === "professional_firm"
        ? {
            firm_type: optionalValue(values.firm_type),
            license_registry: optionalValue(values.license_registry),
          }
        : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="store-entity">Tipo de tienda</Label>
          <select id="store-entity" className={nativeSelectClassName} {...register("entity_type")}>
            <option value="contractor">Contratista</option>
            <option value="education_provider">Educación</option>
            <option value="hardware_store">Ferretería</option>
            <option value="professional_firm">Firma profesional</option>
            <option value="seo_agency">Agencia SEO</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="store-name">Nombre comercial</Label>
          <Input id="store-name" placeholder="Constructora Norte" {...register("name")} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="store-legal">Nombre legal</Label>
          <Input id="store-legal" placeholder="Razón social" {...register("legal_name")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="store-email">Email</Label>
          <Input id="store-email" type="email" placeholder="contacto@empresa.com" {...register("email")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="store-phone">Teléfono</Label>
          <Input id="store-phone" placeholder="+34 600 000 000" {...register("phone")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="store-website">Sitio web</Label>
          <Input id="store-website" placeholder="https://empresa.com" {...register("website")} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="store-description">Descripción</Label>
          <Textarea id="store-description" placeholder="Qué ofrece esta tienda o servicio" {...register("description")} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="store-street">Dirección</Label>
          <Input id="store-street" placeholder="Calle, número y referencia" {...register("street")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="store-city">Ciudad</Label>
          <Input id="store-city" placeholder="Madrid" {...register("city")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="store-state">Provincia / Estado</Label>
          <Input id="store-state" placeholder="Madrid" {...register("state")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="store-country">País</Label>
          <Input id="store-country" placeholder="España" {...register("country")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="store-zip">Código postal</Label>
          <Input id="store-zip" placeholder="28001" {...register("zip")} />
        </div>
      </div>

      {entityType === "hardware_store" && (
        <div className="rounded-xl border bg-zinc-50 p-4">
          <p className="mb-3 text-sm font-medium text-zinc-900">Operación de ferretería</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" {...register("pickup_available")} />
              Retiro en tienda
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" {...register("b2b_enabled")} />
              Canal B2B
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 md:col-span-2">
              <input type="checkbox" {...register("heavy_logistics_enabled")} />
              Logística pesada habilitada
            </label>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="store-warehouses">Cantidad de almacenes</Label>
              <Input id="store-warehouses" type="number" min="0" {...register("warehouse_count")} />
            </div>
          </div>
        </div>
      )}

      {entityType === "contractor" && (
        <div className="rounded-xl border bg-zinc-50 p-4">
          <p className="mb-3 text-sm font-medium text-zinc-900">Cobertura del contratista</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="store-service-area">Tipo de cobertura</Label>
              <Input id="store-service-area" placeholder="regional" {...register("service_area_type")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="store-radius">Radio km</Label>
              <Input id="store-radius" type="number" min="0" step="0.1" {...register("coverage_radius_km")} />
            </div>
          </div>
        </div>
      )}

      {entityType === "professional_firm" && (
        <div className="rounded-xl border bg-zinc-50 p-4">
          <p className="mb-3 text-sm font-medium text-zinc-900">Datos profesionales</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="store-firm-type">Tipo de firma</Label>
              <Input id="store-firm-type" placeholder="Arquitectura" {...register("firm_type")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="store-license">Registro / licencia</Label>
              <Input id="store-license" placeholder="COAM-1234" {...register("license_registry")} />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "create"
              ? "Creando..."
              : "Guardando..."
            : mode === "create"
              ? "Crear tienda"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
