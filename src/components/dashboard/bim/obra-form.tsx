"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateInputValue, getUserDisplayName, nativeSelectClassName, obraEstadoLabels, obraEstadoOptions } from "@/lib/bim";
import type { Obra } from "@/types/bim";
import type { User } from "@/types/marketplace";

const obraFormSchema = z.object({
  codigo: z.string().trim().min(1, "El codigo es requerido"),
  nombre: z.string().trim().min(1, "El nombre es requerido"),
  cliente: z.string().trim().min(1, "El cliente es requerido"),
  ubicacion: z.string().trim().optional(),
  fecha_inicio: z.string().min(1, "La fecha de inicio es requerida"),
  fecha_fin_estimada: z.string().min(1, "La fecha estimada es requerida"),
  fecha_fin_real: z.string().optional(),
  estado: z.enum(obraEstadoOptions),
  moneda: z.string().trim().min(1, "La moneda es requerida"),
  presupuesto_base: z.string().optional(),
  descripcion: z.string().trim().optional(),
  responsable_id: z.string().trim().min(1, "No se encontro el responsable"),
});

type ObraFormValues = z.infer<typeof obraFormSchema>;

function optionalValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getDefaultValues(initialData?: Partial<Obra>, currentUser?: User | null): ObraFormValues {
  return {
    codigo: initialData?.codigo ?? "",
    nombre: initialData?.nombre ?? "",
    cliente: initialData?.cliente ?? "",
    ubicacion: initialData?.ubicacion ?? "",
    fecha_inicio: formatDateInputValue(initialData?.fecha_inicio),
    fecha_fin_estimada: formatDateInputValue(initialData?.fecha_fin_estimada),
    fecha_fin_real: formatDateInputValue(initialData?.fecha_fin_real),
    estado: initialData?.estado ?? "planificacion",
    moneda: initialData?.moneda ?? "USD",
    presupuesto_base: initialData?.presupuesto_base ?? "",
    descripcion: initialData?.descripcion ?? "",
    responsable_id: initialData?.responsable_id ?? currentUser?.id ?? "",
  };
}

interface ObraFormProps {
  mode: "create" | "edit";
  initialData?: Partial<Obra>;
  currentUser?: User | null;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: Partial<Obra>) => Promise<void> | void;
}

export function ObraForm({
  mode,
  initialData,
  currentUser,
  isSubmitting = false,
  submitLabel,
  onSubmit,
}: ObraFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ObraFormValues>({
    resolver: zodResolver(obraFormSchema),
    defaultValues: getDefaultValues(initialData, currentUser),
  });

  useEffect(() => {
    reset(getDefaultValues(initialData, currentUser));
  }, [currentUser, initialData, reset]);

  async function submit(values: ObraFormValues) {
    await onSubmit({
      codigo: values.codigo.trim(),
      nombre: values.nombre.trim(),
      cliente: values.cliente.trim(),
      ubicacion: optionalValue(values.ubicacion),
      fecha_inicio: values.fecha_inicio,
      fecha_fin_estimada: values.fecha_fin_estimada,
      fecha_fin_real: optionalValue(values.fecha_fin_real),
      estado: values.estado,
      moneda: values.moneda.trim().toUpperCase(),
      presupuesto_base: optionalValue(values.presupuesto_base),
      descripcion: optionalValue(values.descripcion),
      responsable_id: values.responsable_id,
    });
  }

  const responsibleLabel = getUserDisplayName(initialData?.responsable ?? currentUser);

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <input type="hidden" {...register("responsable_id")} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="codigo">Codigo</Label>
          <Input id="codigo" placeholder="OBR-001" {...register("codigo")} />
          {errors.codigo && <p className="text-xs text-red-500">{errors.codigo.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="estado">Estado</Label>
          <select id="estado" className={nativeSelectClassName} {...register("estado")}>
            {obraEstadoOptions.map((estado) => (
              <option key={estado} value={estado}>
                {obraEstadoLabels[estado]}
              </option>
            ))}
          </select>
          {errors.estado && <p className="text-xs text-red-500">{errors.estado.message}</p>}
        </div>

        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" placeholder="Torre residencial" {...register("nombre")} />
          {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="cliente">Cliente</Label>
          <Input id="cliente" placeholder="Promotora XYZ" {...register("cliente")} />
          {errors.cliente && <p className="text-xs text-red-500">{errors.cliente.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="ubicacion">Ubicacion</Label>
          <Input id="ubicacion" placeholder="Madrid" {...register("ubicacion")} />
          {errors.ubicacion && <p className="text-xs text-red-500">{errors.ubicacion.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
          <Input id="fecha_inicio" type="date" {...register("fecha_inicio")} />
          {errors.fecha_inicio && <p className="text-xs text-red-500">{errors.fecha_inicio.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="fecha_fin_estimada">Fecha fin estimada</Label>
          <Input id="fecha_fin_estimada" type="date" {...register("fecha_fin_estimada")} />
          {errors.fecha_fin_estimada && (
            <p className="text-xs text-red-500">{errors.fecha_fin_estimada.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="fecha_fin_real">Fecha fin real</Label>
          <Input id="fecha_fin_real" type="date" {...register("fecha_fin_real")} />
          {errors.fecha_fin_real && <p className="text-xs text-red-500">{errors.fecha_fin_real.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="moneda">Moneda</Label>
          <Input id="moneda" placeholder="USD" maxLength={3} {...register("moneda")} />
          {errors.moneda && <p className="text-xs text-red-500">{errors.moneda.message}</p>}
        </div>

        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="presupuesto_base">Presupuesto base</Label>
          <Input id="presupuesto_base" type="number" step="0.01" min="0" placeholder="0.00" {...register("presupuesto_base")} />
          {errors.presupuesto_base && (
            <p className="text-xs text-red-500">{errors.presupuesto_base.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="descripcion">Descripcion</Label>
        <Textarea id="descripcion" placeholder="Alcance y observaciones principales de la obra" {...register("descripcion")} />
        {errors.descripcion && <p className="text-xs text-red-500">{errors.descripcion.message}</p>}
      </div>

      <div className="rounded-lg border bg-zinc-50 p-3 text-sm text-zinc-600">
        <p className="font-medium text-zinc-700">Responsable asignado</p>
        <p>{responsibleLabel}</p>
        <p className="text-xs text-zinc-500">
          {mode === "create"
            ? "La obra se crea con el usuario autenticado como responsable."
            : "El responsable actual se conserva mientras no se gestione desde el backend."}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "create"
              ? "Creando..."
              : "Guardando..."
            : submitLabel ?? (mode === "create" ? "Crear obra" : "Guardar cambios")}
        </Button>
      </div>
    </form>
  );
}
