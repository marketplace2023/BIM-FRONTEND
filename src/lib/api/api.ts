import api from "./axios";
import type {
  AuthResponse,
  Store,
  Product,
  Category,
  Order,
  PaginatedResponse,
  StorePaymentMethod,
} from "@/types/marketplace";
import type {
  AsignacionContratistaObra,
  Certificacion,
  Contratista,
  Obra,
  PrecioUnitario,
  Presupuesto,
  Recurso,
} from "@/types/bim";

function getStoreContextHeaders(storeContextId?: string) {
  return storeContextId ? { headers: { "x-store-context": storeContextId } } : undefined;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }),

  me: () => api.get<AuthResponse["user"]>("/auth/me"),

  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => api.post<AuthResponse>("/auth/register", data),
};

export const storesApi = {
  getMyStore: (id: string) => api.get<Store>(`/stores/${id}`),
  create: (data: Record<string, unknown>) => api.post<Store>("/stores", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch<Store>(`/stores/${id}`, data),
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Store>>("/stores", { params }),
  getById: (id: string) => api.get<Store>(`/stores/${id}`),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{ data: { url: string } }>("/stores/upload-logo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const productsApi = {
  getMyProducts: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Product>>("/products", { params }),
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Product>>("/products", { params }),
  getById: (id: string) => api.get<Product>(`/products/${id}`),
  create: (data: Record<string, unknown>, storeContextId?: string) =>
    api.post<Product>("/products", data, getStoreContextHeaders(storeContextId)),
  update: (id: string, data: Record<string, unknown>, storeContextId?: string) =>
    api.patch<Product>(`/products/${id}`, data, getStoreContextHeaders(storeContextId)),
  delete: (id: string, storeContextId?: string) =>
    api.delete(`/products/${id}`, getStoreContextHeaders(storeContextId)),
  publish: (id: string, storeContextId?: string) =>
    api.patch<Product>(`/products/${id}/publish`, undefined, getStoreContextHeaders(storeContextId)),
  unpublish: (id: string, storeContextId?: string) =>
    api.patch<Product>(`/products/${id}/unpublish`, undefined, getStoreContextHeaders(storeContextId)),
  uploadImages: (files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    return api.post<{ data: Array<{ url: string }> }>("/products/upload-images", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const categoriesApi = {
  getAll: (params?: Record<string, unknown>) => api.get<Category[]>("/categories", { params }),
  getById: (id: string) => api.get<Category>(`/categories/${id}`),
};

export const ordersApi = {
  getMyOrders: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Order>>("/orders", { params }),
  getById: (id: string) => api.get<Order>(`/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch<Order>(`/orders/${id}/status`, { status }),
};

export const paymentMethodsApi = {
  getMy: (storeId: string) => api.get<StorePaymentMethod[]>(`/stores/public/${storeId}/payment-methods`),
  create: (data: Partial<StorePaymentMethod>) =>
    api.post<StorePaymentMethod>("/store-payment-methods", data),
  update: (id: string, data: Partial<StorePaymentMethod>) =>
    api.patch<StorePaymentMethod>(`/store-payment-methods/${id}`, data),
  delete: (id: string) => api.delete(`/store-payment-methods/${id}`),
};

export const obrasApi = {
  getAll: (params?: Record<string, unknown>) => api.get<Obra[]>("/obras", { params }),
  getById: (id: string) => api.get<Obra>(`/obras/${id}`),
  create: (data: Partial<Obra>) => api.post<Obra>("/obras", data),
  update: (id: string, data: Partial<Obra>) =>
    api.patch<Obra>(`/obras/${id}`, data),
  delete: (id: string) => api.delete(`/obras/${id}`),
};

export const contratistasApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<Contratista[]>("/contratistas", { params }),
  getById: (id: string) => api.get<Contratista>(`/contratistas/${id}`),
  create: (data: Partial<Contratista>) =>
    api.post<Contratista>("/contratistas", data),
  update: (id: string, data: Partial<Contratista>) =>
    api.patch<Contratista>(`/contratistas/${id}`, data),
  delete: (id: string) => api.delete(`/contratistas/${id}`),
  getByObra: (obraId: string) =>
    api.get<AsignacionContratistaObra[]>(`/contratistas/obras/${obraId}/contratistas`),
  assignToObra: (
    obraId: string,
    data: {
      contratista_id: string;
      rol?: string;
      monto_contrato?: string;
      fecha_inicio?: string;
      fecha_fin?: string;
      estado?: "vigente" | "finalizado" | "rescindido";
    },
  ) => api.post<AsignacionContratistaObra>(`/contratistas/obras/${obraId}/contratistas`, data),
  unassignFromObra: (obraId: string, contratistaId: string) =>
    api.delete(`/contratistas/obras/${obraId}/contratistas/${contratistaId}`),
};

export const presupuestosApi = {
  getByObra: (obraId: string) => api.get<Presupuesto[]>(`/presupuestos/obra/${obraId}`),
  getById: (id: string) => api.get<Presupuesto>(`/presupuestos/${id}`),
  getTree: (id: string) => api.get<Presupuesto>(`/presupuestos/${id}/arbol`),
  create: (data: Partial<Presupuesto>) =>
    api.post<Presupuesto>("/presupuestos", data),
  update: (id: string, data: Partial<Presupuesto>) =>
    api.patch<Presupuesto>(`/presupuestos/${id}`, data),
  approve: (id: string) => api.patch<Presupuesto>(`/presupuestos/${id}/aprobar`),
  recalculate: (id: string) =>
    api.patch<Presupuesto>(`/presupuestos/${id}/recalcular`),
  delete: (id: string) => api.delete(`/presupuestos/${id}`),
  createCapitulo: (
    presupuestoId: string,
    data: {
      codigo: string;
      nombre: string;
      orden?: number;
      parent_id?: string;
    },
  ) => api.post(`/presupuestos/${presupuestoId}/capitulos`, data),
  updateCapitulo: (
    capituloId: string,
    data: {
      codigo?: string;
      nombre?: string;
      orden?: number;
      parent_id?: string;
    },
  ) => api.patch(`/presupuestos/capitulos/${capituloId}`, data),
  deleteCapitulo: (capituloId: string) =>
    api.delete(`/presupuestos/capitulos/${capituloId}`),
  createPartida: (
    capituloId: string,
    data: {
      codigo: string;
      descripcion: string;
      unidad: string;
      cantidad: string;
      precio_unitario: string;
      precio_unitario_id?: string;
      observaciones?: string;
      orden?: number;
    },
  ) => api.post(`/presupuestos/capitulos/${capituloId}/partidas`, data),
  updatePartida: (
    partidaId: string,
    data: {
      codigo?: string;
      descripcion?: string;
      unidad?: string;
      cantidad?: string;
      precio_unitario?: string;
      precio_unitario_id?: string;
      observaciones?: string;
      orden?: number;
    },
  ) => api.patch(`/presupuestos/partidas/${partidaId}`, data),
  deletePartida: (partidaId: string) => api.delete(`/presupuestos/partidas/${partidaId}`),
};

export const preciosUnitariosApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PrecioUnitario[]>("/precios-unitarios", { params }),
  getById: (id: string) => api.get<PrecioUnitario>(`/precios-unitarios/${id}`),
  create: (data: Partial<PrecioUnitario>) =>
    api.post<PrecioUnitario>("/precios-unitarios", data),
  update: (id: string, data: Partial<PrecioUnitario>) =>
    api.patch<PrecioUnitario>(`/precios-unitarios/${id}`, data),
  delete: (id: string) => api.delete(`/precios-unitarios/${id}`),
  getRecursos: (params?: Record<string, unknown>) =>
    api.get<Recurso[]>("/precios-unitarios/recursos", { params }),
  createRecurso: (data: Partial<Recurso>) =>
    api.post<Recurso>("/precios-unitarios/recursos", data),
  updateRecurso: (id: string, data: Partial<Recurso>) =>
    api.patch<Recurso>(`/precios-unitarios/recursos/${id}`, data),
  deleteRecurso: (id: string) => api.delete(`/precios-unitarios/recursos/${id}`),
  addDescomposicion: (id: string, data: Record<string, unknown>) =>
    api.post(`/precios-unitarios/${id}/descomposicion`, data),
  updateDescomposicion: (id: string, data: Record<string, unknown>) =>
    api.patch(`/precios-unitarios/descomposicion/${id}`, data),
  deleteDescomposicion: (id: string) =>
    api.delete(`/precios-unitarios/descomposicion/${id}`),
};

export const certificacionesApi = {
  getByObra: (obraId: string) =>
    api.get<Certificacion[]>(`/certificaciones/obra/${obraId}`),
  getById: (id: string) => api.get<Certificacion>(`/certificaciones/${id}`),
  create: (data: {
    obra_id: string;
    presupuesto_id: string;
    periodo_desde: string;
    periodo_hasta: string;
    observaciones?: string;
    lineas?: Array<{
      partida_id: string;
      cantidad_presupuesto: string;
      cantidad_anterior: string;
      cantidad_actual: string;
      precio_unitario: string;
    }>;
  }) =>
    api.post<Certificacion>("/certificaciones", data),
  changeStatus: (
    id: string,
    data: { estado: "borrador" | "revisada" | "aprobada" | "facturada"; observaciones?: string },
  ) => api.patch<Certificacion>(`/certificaciones/${id}/estado`, data),
  delete: (id: string) => api.delete(`/certificaciones/${id}`),
};
