"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contratistaTipoLabels, contratistaTipoOptions, nativeSelectClassName } from "@/lib/bim";
import type { Contratista } from "@/types/bim";

const contratistaFormSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es requerido"),
  nombre_legal: z.string().trim().optional(),
  rut_nif: z.string().trim().optional(),
  tipo: z.enum(contratistaTipoOptions),
  contacto_nombre: z.string().trim().optional(),
  contacto_email: z.string().trim().refine((value) => !value || z.string().email().safeParse(value).success, {
    message: "Email invalido",
  }),
  contacto_tel: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  ciudad: z.string().trim().optional(),
  pais: z.string().trim().optional(),
});

type ContratistaFormValues = z.infer<typeof contratistaFormSchema>;

function optionalValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getDefaultValues(initialData?: Partial<Contratista>): ContratistaFormValues {
  return {
    nombre: initialData?.nombre ?? "",
    nombre_legal: initialData?.nombre_legal ?? "",
    rut_nif: initialData?.rut_nif ?? "",
    tipo: initialData?.tipo ?? "empresa",
    contacto_nombre: initialData?.contacto_nombre ?? "",
    contacto_email: initialData?.contacto_email ?? "",
    contacto_tel: initialData?.contacto_tel ?? "",
    direccion: initialData?.direccion ?? "",
    ciudad: initialData?.ciudad ?? "",
    pais: initialData?.pais ?? "España",
  };
}

interface ContratistaFormProps {
  mode: "create" | "edit";
  initialData?: Partial<Contratista>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: Partial<Contratista>) => Promise<void> | void;
}

export function ContratistaForm({
  mode,
  initialData,
  isSubmitting = false,
  submitLabel,
  onSubmit,
}: ContratistaFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContratistaFormValues>({
    resolver: zodResolver(contratistaFormSchema),
    defaultValues: getDefaultValues(initialData),
  });

  useEffect(() => {
    reset(getDefaultValues(initialData));
  }, [initialData, reset]);

  async function submit(values: ContratistaFormValues) {
    await onSubmit({
      nombre: values.nombre.trim(),
      nombre_legal: optionalValue(values.nombre_legal),
      rut_nif: optionalValue(values.rut_nif),
      tipo: values.tipo,
      contacto_nombre: optionalValue(values.contacto_nombre),
      contacto_email: optionalValue(values.contacto_email),
      contacto_tel: optionalValue(values.contacto_tel),
      direccion: optionalValue(values.direccion),
      ciudad: optionalValue(values.ciudad),
      pais: optionalValue(values.pais),
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" placeholder="Instalaciones Tecnicas SA" {...register("nombre")} />
          {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="nombre_legal">Nombre legal</Label>
          <Input id="nombre_legal" placeholder="Razon social" {...register("nombre_legal")} />
          {errors.nombre_legal && (
            <p className="text-xs text-red-500">{errors.nombre_legal.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="rut_nif">RUT / NIF</Label>
          <Input id="rut_nif" placeholder="B12345678" {...register("rut_nif")} />
          {errors.rut_nif && <p className="text-xs text-red-500">{errors.rut_nif.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="tipo">Tipo</Label>
          <select id="tipo" className={nativeSelectClassName} {...register("tipo")}>
            {contratistaTipoOptions.map((tipo) => (
              <option key={tipo} value={tipo}>
                {contratistaTipoLabels[tipo]}
              </option>
            ))}
          </select>
          {errors.tipo && <p className="text-xs text-red-500">{errors.tipo.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="contacto_nombre">Contacto</Label>
          <Input id="contacto_nombre" placeholder="Nombre del contacto" {...register("contacto_nombre")} />
          {errors.contacto_nombre && (
            <p className="text-xs text-red-500">{errors.contacto_nombre.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="contacto_email">Email</Label>
          <Input id="contacto_email" type="email" placeholder="contacto@empresa.com" {...register("contacto_email")} />
          {errors.contacto_email && (
            <p className="text-xs text-red-500">{errors.contacto_email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="contacto_tel">Telefono</Label>
          <Input id="contacto_tel" placeholder="+34 600 000 000" {...register("contacto_tel")} />
          {errors.contacto_tel && (
            <p className="text-xs text-red-500">{errors.contacto_tel.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="ciudad">Ciudad</Label>
          <Input id="ciudad" placeholder="Madrid" {...register("ciudad")} />
          {errors.ciudad && <p className="text-xs text-red-500">{errors.ciudad.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="pais">Pais</Label>
          <Input id="pais" placeholder="España" {...register("pais")} />
          {errors.pais && <p className="text-xs text-red-500">{errors.pais.message}</p>}
        </div>

        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="direccion">Direccion</Label>
          <Textarea id="direccion" placeholder="Direccion fiscal o comercial" {...register("direccion")} />
          {errors.direccion && <p className="text-xs text-red-500">{errors.direccion.message}</p>}
        </div>
      </div>

      {initialData?.estado && (
        <div className="rounded-lg border bg-zinc-50 p-3 text-sm text-zinc-600">
          Estado actual: <span className="font-medium text-zinc-800">{initialData.estado}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "create"
              ? "Creando..."
              : "Guardando..."
            : submitLabel ?? (mode === "create" ? "Crear contratista" : "Guardar cambios")}
        </Button>
      </div>
    </form>
  );
}
