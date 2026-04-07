"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nativeSelectClassName } from "@/lib/bim";
import type { Presupuesto } from "@/types/bim";

const presupuestoSchema = z.object({
  tipo: z.enum(["obra", "orientativo"]),
  nombre: z.string().trim().min(1, "El nombre es requerido"),
  descripcion: z.string().trim().optional(),
  moneda: z.string().trim().min(1, "La moneda es requerida"),
  gastos_indirectos_pct: z.string().optional(),
  beneficio_pct: z.string().optional(),
  iva_pct: z.string().optional(),
});

type PresupuestoFormValues = z.infer<typeof presupuestoSchema>;

function optionalValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getDefaultValues(initialData?: Partial<Presupuesto>): PresupuestoFormValues {
  return {
    tipo: initialData?.tipo ?? "obra",
    nombre: initialData?.nombre ?? "",
    descripcion: initialData?.descripcion ?? "",
    moneda: initialData?.moneda ?? "USD",
    gastos_indirectos_pct: initialData?.gastos_indirectos_pct ?? "0",
    beneficio_pct: initialData?.beneficio_pct ?? "0",
    iva_pct: initialData?.iva_pct ?? "21",
  };
}

interface PresupuestoFormProps {
  mode: "create" | "edit";
  initialData?: Partial<Presupuesto>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: Partial<Presupuesto>) => Promise<void> | void;
}

export function PresupuestoForm({
  mode,
  initialData,
  isSubmitting = false,
  submitLabel,
  onSubmit,
}: PresupuestoFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PresupuestoFormValues>({
    resolver: zodResolver(presupuestoSchema),
    defaultValues: getDefaultValues(initialData),
  });

  useEffect(() => {
    reset(getDefaultValues(initialData));
  }, [initialData, reset]);

  async function submit(values: PresupuestoFormValues) {
    await onSubmit({
      tipo: values.tipo,
      nombre: values.nombre.trim(),
      descripcion: optionalValue(values.descripcion),
      moneda: values.moneda.trim().toUpperCase(),
      gastos_indirectos_pct: optionalValue(values.gastos_indirectos_pct) ?? "0",
      beneficio_pct: optionalValue(values.beneficio_pct) ?? "0",
      iva_pct: optionalValue(values.iva_pct) ?? "21",
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="presupuesto-tipo">Tipo</Label>
          <select id="presupuesto-tipo" className={nativeSelectClassName} {...register("tipo")}>
            <option value="obra">Obra</option>
            <option value="orientativo">Orientativo</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="presupuesto-moneda">Moneda</Label>
          <Input id="presupuesto-moneda" maxLength={3} placeholder="USD" {...register("moneda")} />
          {errors.moneda && <p className="text-xs text-red-500">{errors.moneda.message}</p>}
        </div>

        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="presupuesto-nombre">Nombre</Label>
          <Input id="presupuesto-nombre" placeholder="Presupuesto base de obra" {...register("nombre")} />
          {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="presupuesto-gi">Gastos indirectos %</Label>
          <Input id="presupuesto-gi" type="number" step="0.01" {...register("gastos_indirectos_pct")} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="presupuesto-beneficio">Beneficio %</Label>
          <Input id="presupuesto-beneficio" type="number" step="0.01" {...register("beneficio_pct")} />
        </div>

        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="presupuesto-iva">IVA %</Label>
          <Input id="presupuesto-iva" type="number" step="0.01" {...register("iva_pct")} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="presupuesto-descripcion">Descripción</Label>
        <Textarea id="presupuesto-descripcion" placeholder="Observaciones generales del presupuesto" {...register("descripcion")} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "create"
              ? "Guardando..."
              : "Actualizando..."
            : submitLabel ?? (mode === "create" ? "Crear presupuesto" : "Guardar cambios")}
        </Button>
      </div>
    </form>
  );
}
