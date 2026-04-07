"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateInputValue } from "@/lib/bim";
import type { PrecioUnitario } from "@/types/bim";

const precioUnitarioSchema = z.object({
  codigo: z.string().trim().min(1, "El código es requerido"),
  descripcion: z.string().trim().min(1, "La descripción es requerida"),
  unidad: z.string().trim().min(1, "La unidad es requerida"),
  categoria: z.string().trim().optional(),
  rendimiento: z.string().min(1, "El rendimiento es requerido"),
  vigencia: z.string().min(1, "La vigencia es requerida"),
});

type PrecioUnitarioFormValues = z.infer<typeof precioUnitarioSchema>;

function optionalValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getDefaultValues(initialData?: Partial<PrecioUnitario>): PrecioUnitarioFormValues {
  return {
    codigo: initialData?.codigo ?? "",
    descripcion: initialData?.descripcion ?? "",
    unidad: initialData?.unidad ?? "",
    categoria: initialData?.categoria ?? "",
    rendimiento: initialData?.rendimiento ?? "1",
    vigencia: formatDateInputValue(initialData?.vigencia),
  };
}

interface PrecioUnitarioFormProps {
  initialData?: Partial<PrecioUnitario>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: Partial<PrecioUnitario>) => Promise<void> | void;
}

export function PrecioUnitarioForm({
  initialData,
  isSubmitting = false,
  submitLabel,
  onSubmit,
}: PrecioUnitarioFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PrecioUnitarioFormValues>({
    resolver: zodResolver(precioUnitarioSchema),
    defaultValues: getDefaultValues(initialData),
  });

  useEffect(() => {
    reset(getDefaultValues(initialData));
  }, [initialData, reset]);

  async function submit(values: PrecioUnitarioFormValues) {
    await onSubmit({
      codigo: values.codigo.trim(),
      descripcion: values.descripcion.trim(),
      unidad: values.unidad.trim(),
      categoria: optionalValue(values.categoria),
      rendimiento: values.rendimiento,
      vigencia: values.vigencia,
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="apu-codigo">Código</Label>
          <Input id="apu-codigo" placeholder="APU-001" {...register("codigo")} />
          {errors.codigo && <p className="text-xs text-red-500">{errors.codigo.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="apu-unidad">Unidad</Label>
          <Input id="apu-unidad" placeholder="m2" {...register("unidad")} />
          {errors.unidad && <p className="text-xs text-red-500">{errors.unidad.message}</p>}
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="apu-descripcion">Descripción</Label>
          <Input id="apu-descripcion" placeholder="Ejecución de muro de bloques" {...register("descripcion")} />
          {errors.descripcion && <p className="text-xs text-red-500">{errors.descripcion.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="apu-categoria">Categoría</Label>
          <Input id="apu-categoria" placeholder="Albañilería" {...register("categoria")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="apu-rendimiento">Rendimiento</Label>
          <Input id="apu-rendimiento" type="number" step="0.0001" min="0.0001" {...register("rendimiento")} />
          {errors.rendimiento && <p className="text-xs text-red-500">{errors.rendimiento.message}</p>}
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="apu-vigencia">Vigencia</Label>
          <Input id="apu-vigencia" type="date" {...register("vigencia")} />
          {errors.vigencia && <p className="text-xs text-red-500">{errors.vigencia.message}</p>}
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : submitLabel ?? "Guardar APU"}
        </Button>
      </div>
    </form>
  );
}
