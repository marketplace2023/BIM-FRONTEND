"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/api";
import { nativeSelectClassName } from "@/lib/bim";
import { useAuthStore } from "@/lib/stores/auth-store";

const schema = z
  .object({
    name: z.string().trim().min(1, "El nombre es requerido"),
    username: z.string().trim().min(3, "El usuario debe tener al menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirma la contraseña"),
    role: z.enum(["consumer", "store"]),
    entity_type: z
      .enum([
        "contractor",
        "education_provider",
        "hardware_store",
        "professional_firm",
        "seo_agency",
      ])
      .optional(),
    phone: z.string().trim().optional(),
    city: z.string().trim().optional(),
    country: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden",
      });
    }

    if (values.role === "store" && !values.entity_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entity_type"],
        message: "Selecciona un tipo de tienda",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "store",
      entity_type: "hardware_store",
      country: "España",
    },
  });

  const role = watch("role");

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const { data } = await authApi.register({
        name: values.name.trim(),
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        entity_type: values.role === "store" ? values.entity_type : undefined,
        phone: values.phone?.trim() || undefined,
        city: values.city?.trim() || undefined,
        country: values.country?.trim() || undefined,
      });

      login(data.access_token, data.user);
      toast.success("Cuenta creada correctamente");
      router.push("/dashboard");
    } catch {
      toast.error("No se pudo completar el registro. Revisa los datos e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex justify-center">
            <Image
              src="/bim-dueck-logo.svg"
              alt="BIM Dueck"
              width={220}
              height={68}
              className="h-14 w-auto"
              priority
            />
          </div>
          <CardTitle className="text-xl">Crear cuenta</CardTitle>
          <p className="text-sm text-zinc-500">Regístrate para usar la plataforma</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" placeholder="Tu nombre o empresa" {...register("name")} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="username">Usuario</Label>
                <Input id="username" placeholder="usuario123" {...register("username")} />
                {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="role">Tipo de cuenta</Label>
                <select id="role" className={nativeSelectClassName} {...register("role")}>
                  <option value="store">Tienda / proveedor</option>
                  <option value="consumer">Cliente</option>
                </select>
              </div>
              {role === "store" && (
                <div className="space-y-1">
                  <Label htmlFor="entity_type">Vertical</Label>
                  <select id="entity_type" className={nativeSelectClassName} {...register("entity_type")}>
                    <option value="contractor">Contratista</option>
                    <option value="education_provider">Educación</option>
                    <option value="hardware_store">Ferretería</option>
                    <option value="professional_firm">Firma profesional</option>
                    <option value="seo_agency">Agencia SEO</option>
                  </select>
                  {errors.entity_type && <p className="text-xs text-red-500">{errors.entity_type.message}</p>}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" placeholder="+34 600 000 000" {...register("phone")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" placeholder="Madrid" {...register("city")} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="country">País</Label>
                <Input id="country" placeholder="España" {...register("country")} />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Registrarme"}
            </Button>

            <p className="text-center text-sm text-zinc-500">
              ¿Ya tienes cuenta?{" "}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
