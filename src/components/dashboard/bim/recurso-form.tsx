"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName, formatDateInputValue } from "@/lib/bim";
import type { Recurso } from "@/types/bim";

const recursoSchema = z.object({
  codigo: z.string().trim().min(1, "El código es requerido"),
  descripcion: z.string().trim().min(1, "La descripción es requerida"),
  unidad: z.string().trim().min(1, "La unidad es requerida"),
  tipo: z.enum(["mano_obra", "material", "equipo", "subcontrato"]),
  precio: z.string().min(1, "El precio es requerido"),
  vigencia: z.string().min(1, "La vigencia es requerida"),
});

type RecursoFormValues = z.infer<typeof recursoSchema>;

function getDefaultValues(initialData?: Partial<Recurso>): RecursoFormValues {
  return {
    codigo: initialData?.codigo ?? "",
    descripcion: initialData?.descripcion ?? "",
    unidad: initialData?.unidad ?? "",
    tipo: initialData?.tipo ?? "material",
    precio: initialData?.precio ?? "0",
    vigencia: formatDateInputValue(initialData?.vigencia),
  };
}

interface RecursoFormProps {
  initialData?: Partial<Recurso>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: Partial<Recurso>) => Promise<void> | void;
}

export function RecursoForm({
  initialData,
  isSubmitting = false,
  submitLabel,
  onSubmit,
}: RecursoFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecursoFormValues>({
    resolver: zodResolver(recursoSchema),
    defaultValues: getDefaultValues(initialData),
  });

  useEffect(() => {
    reset(getDefaultValues(initialData));
  }, [initialData, reset]);

  async function submit(values: RecursoFormValues) {
    await onSubmit({
      codigo: values.codigo.trim(),
      descripcion: values.descripcion.trim(),
      unidad: values.unidad.trim(),
      tipo: values.tipo,
      precio: values.precio,
      vigencia: values.vigencia,
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="recurso-codigo">Código</Label>
          <Input id="recurso-codigo" placeholder="MAT-001" {...register("codigo")} />
          {errors.codigo && <p className="text-xs text-red-500">{errors.codigo.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="recurso-unidad">Unidad</Label>
          <Input id="recurso-unidad" placeholder="m2" {...register("unidad")} />
          {errors.unidad && <p className="text-xs text-red-500">{errors.unidad.message}</p>}
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="recurso-descripcion">Descripción</Label>
          <Input id="recurso-descripcion" placeholder="Hormigón fck 25 MPa" {...register("descripcion")} />
          {errors.descripcion && <p className="text-xs text-red-500">{errors.descripcion.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="recurso-tipo">Tipo</Label>
          <select id="recurso-tipo" className={nativeSelectClassName} {...register("tipo")}>
            <option value="mano_obra">Mano de obra</option>
            <option value="material">Material</option>
            <option value="equipo">Equipo</option>
            <option value="subcontrato">Subcontrato</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="recurso-precio">Precio</Label>
          <Input id="recurso-precio" type="number" step="0.0001" min="0" {...register("precio")} />
          {errors.precio && <p className="text-xs text-red-500">{errors.precio.message}</p>}
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="recurso-vigencia">Vigencia</Label>
          <Input id="recurso-vigencia" type="date" {...register("vigencia")} />
          {errors.vigencia && <p className="text-xs text-red-500">{errors.vigencia.message}</p>}
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : submitLabel ?? "Guardar recurso"}
        </Button>
      </div>
    </form>
  );
}
