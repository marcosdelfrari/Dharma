export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;
  errors: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details: unknown = null,
    errors: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.errors = errors;
  }
}

export type ApiEnvelope<T> = {
  data: T;
  meta: Record<string, unknown> | null;
  errors: Array<{ code: string; message: string; details?: unknown }> | null;
};

const APP = "dharma";
const BASE = "/api/v1";

function withQuery(path: string, query = "") {
  if (!query) return path;
  return `${path}${query.startsWith("?") ? query : `?${query}`}`;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {
    "X-Dharma-App": APP,
  };
  let payload: BodyInit | undefined;
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  } else if (body instanceof FormData) {
    payload = body;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : payload,
  });

  const json = (await res.json().catch(() => ({
    data: null,
    meta: null,
    errors: [{ code: "INTERNAL_ERROR", message: "Resposta inválida" }],
  }))) as ApiEnvelope<T>;

  if (!res.ok) {
    const err0 = json.errors?.[0] || {
      code: "INTERNAL_ERROR",
      message: res.statusText,
    };
    throw new ApiError(
      res.status,
      err0.code || "INTERNAL_ERROR",
      err0.message || res.statusText,
      err0.details,
      json.errors,
    );
  }

  return json;
}

export function qs(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") search.set(key, String(value));
  });
  const out = search.toString();
  return out ? `?${out}` : "";
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),

  login: (email: string, password: string) =>
    request<{ user: OperatorUser }>("POST", "/auth/login", { email, password }),
  logout: () => request<null>("POST", "/auth/logout", {}),
  me: () =>
    request<{ user: OperatorUser; role_pages?: unknown }>("GET", "/auth/me"),

  forgotOperatorPassword: (email: string, app = "dharma") =>
    request<{ ok?: boolean }>("POST", "/auth/forgot-password", { email, app }),
  resetOperatorPassword: (token: string, password: string) =>
    request<{ ok?: boolean }>("POST", "/auth/reset-password", { token, password }),

  listUsers: (query = "") =>
    request<Associate[]>("GET", withQuery("/users", query)),
  searchUsers: (q: string) =>
    request<Associate[]>("GET", `/users/search?q=${encodeURIComponent(q)}`),
  getUserByCode: (userCode: string) =>
    request<Associate>("GET", `/users/by-code/${encodeURIComponent(userCode)}`),
  listUserPatients: (userId: number) =>
    request<Associate[]>("GET", `/users/${userId}/patients`),
  createUserPatient: (userId: number, body: Partial<Associate>) =>
    request<Associate>("POST", `/users/${userId}/patients`, body),
  updateUserPatient: (userId: number, patientId: number, body: Partial<Associate>) =>
    request<Associate>("PATCH", `/users/${userId}/patients/${patientId}`, body),
  deleteUserPatient: (userId: number, patientId: number) =>
    request<unknown>("DELETE", `/users/${userId}/patients/${patientId}`),
  getUserHistory: (userId: number) =>
    request<UserHistory>("GET", `/users/${userId}/history`),

  listItems: <T>(collection: string, query = "") =>
    request<T[]>("GET", withQuery(`/items/${collection}`, query)),
  createItem: <T>(collection: string, body: Record<string, unknown>) =>
    request<T>("POST", `/items/${collection}`, body),
  attachFileToItem: (
    fileId: number | string,
    body: { collection: string; item_id: number },
  ) => request<unknown>("POST", `/files/${fileId}/attach`, body),

  listServicesByGroup: (bookingGroupCode: string) =>
    request<Service[]>(
      "GET",
      `/services/by-group/${encodeURIComponent(bookingGroupCode)}`,
    ),
  createUser: (body: Partial<Associate>) =>
    request<Associate>("POST", "/users", body),
  updateUser: (id: number, body: Partial<Associate>) =>
    request<Associate>("PATCH", `/users/${id}`, body),
  makeAssociate: (id: number) =>
    request<Associate>("POST", `/users/${id}/make-associate`, {}),

  listProducts: (query = "") =>
    request<Product[]>("GET", withQuery("/items/products", query)),
  createProduct: (body: Partial<Product>) =>
    request<Product>("POST", "/items/products", body),
  updateProduct: (id: number, body: Partial<Product>) =>
    request<Product>("PATCH", `/items/products/${id}`, body),

  listOrders: (query = "") =>
    request<Order[]>("GET", withQuery("/orders", query)),
  getOrder: (id: number) => request<Order>("GET", `/orders/${id}`),
  createOrder: (body: CreateOrderBody) =>
    request<Order>("POST", "/orders", body),
  updateOrder: (id: number, body: Partial<Order>) =>
    request<Order>("PATCH", `/orders/${id}`, body),
  updateOrderStatus: (id: number, status: string) =>
    request<Order>("PATCH", `/orders/${id}/status`, { status }),
  deleteOrder: (id: number) => request<null>("DELETE", `/orders/${id}`),
  listOrdersByUser: (userCode: string) =>
    request<Order[]>("GET", `/orders/by-user/${encodeURIComponent(userCode)}`),
  updateOrderProduction: (
    id: number,
    body: { production_owner?: string; status?: string },
  ) => request<Order>("PATCH", `/orders/${id}/production`, body),
  ordersBulk: (body: OrdersBulkBody) =>
    request<{ results: BulkActionResult[] }>("POST", "/orders/bulk", body),
  listOrderFiles: (orderId: number) =>
    request<OrderFile[]>("GET", `/orders/${orderId}/files`),
  attachOrderFile: (
    orderId: number,
    body: { file_id: number | string; confirm_payment?: boolean },
  ) =>
    request<{ file?: OrderFile; order?: Order; payment_confirmed?: boolean }>(
      "POST",
      `/orders/${orderId}/files`,
      body,
    ),
  getOrderTracking: (orderId: number) =>
    request<OrderTracking>("GET", `/orders/${orderId}/tracking`),
  ordersStatusConfig: () =>
    request<{ statuses?: string[] } | string[]>("GET", "/orders/status-config"),

  uploadFile: (formData: FormData) =>
    request<{ id: number | string; filename?: string }>("POST", "/files", formData),
  getFile: (id: number | string) =>
    request<{ id: number | string; filename?: string; mime_type?: string; name?: string }>(
      "GET",
      `/files/${encodeURIComponent(String(id))}`,
    ),
  fileDownloadPath: (fileId: number | string) =>
    `/api/v1/files/${encodeURIComponent(String(fileId))}/download`,

  getPagarmeStatus: () => request<PagarmeStatus>("GET", "/modules/pagarme/status"),
  createPagarmeCheckout: (body: {
    context?: "order" | "service";
    entity_id: number;
    methods: string[];
    amount_override?: number;
  }) => request<PagarmeCheckoutResult>("POST", "/modules/pagarme/orders", body),

  freightLabelAvailability: () =>
    request<{ loggi?: boolean; melhorenvio?: boolean; reason?: string }>(
      "GET",
      "/freight/label-availability",
    ),

  listReception: (query = "") =>
    request<Reception[]>("GET", withQuery("/items/reception", query)),
  updateReceptionStatus: (id: number, status: string) =>
    request<Reception>("PATCH", `/reception/${id}/status`, { status }),
  receptionStatusCounts: () =>
    request<Record<string, number>>("GET", "/reception/status-counts"),
  receptionAttendants: () =>
    request<ReceptionAttendant[]>("GET", "/reception/attendants"),
  updateReceptionAttendant: (id: number, attendant: string | null) =>
    request<Reception>("PATCH", `/reception/${id}/attendant`, { attendant }),
  completeReception: (id: number, completion_reason?: string) =>
    request<Reception>("PATCH", `/reception/${id}/complete`, {
      completion_reason: completion_reason || undefined,
    }),
  linkReceptionAssociate: (id: number, associate_code: string) =>
    request<Reception>("PATCH", `/reception/${id}/link`, { associate_code }),
  unlinkReceptionAssociate: (id: number) =>
    request<Reception>("PATCH", `/reception/${id}/unlink`, {}),
  updateReceptionChat: (id: number, chat_id: string | null) =>
    request<Reception>("PATCH", `/reception/${id}/chat`, { chat_id }),
  syncReceptionUtalk: (id: number) =>
    request<Reception & { utalk?: unknown }>("POST", `/reception/${id}/utalk-sync`, {}),
  syncUtalkWaiting: (concurrency?: number) =>
    request<unknown>("POST", "/reception/utalk-sync-waiting", {
      concurrency: concurrency || undefined,
    }),

  getUtalkStatus: () =>
    request<{ enabled?: boolean; has_api_token?: boolean }>("GET", "/modules/utalk/status"),

  listUserFiles: (userId: number, docKind?: string) =>
    request<UserFile[]>(
      "GET",
      withQuery("/files", qs({ user_id: userId, limit: 50, doc_kind: docKind || undefined })),
    ),

  markServicePaid: (id: number) =>
    request<Service>("POST", `/services/${id}/mark-paid`, {}),
  receptionFormSchema: () =>
    request<ReceptionFormSchema>("GET", "/reception/form-schema"),
  createPublicReception: (body: Record<string, unknown>) =>
    request<Reception>("POST", "/reception/public", body),
  createLandingLead: (body: { name: string; phone: string }) =>
    request<Reception>("POST", "/reception/landing-lead", body),

  getPublicConfig: (system: string) =>
    request<{ system?: string; values?: Record<string, unknown>; errors?: unknown[] }>(
      "GET",
      `/config/public?system=${encodeURIComponent(system)}`,
    ),

  previewSystemInvite: (token: string) =>
    request<SystemInvitePreview>(
      "GET",
      `/auth/system-invite/preview?token=${encodeURIComponent(token)}`,
    ),
  acceptSystemInvite: (body: {
    token: string;
    password: string;
    name?: string;
    last_name?: string;
  }) => request<{ user?: SystemUser }>("POST", "/auth/system-invite/accept", body),

  freightQuote: (body: { address: FreightAddress; items?: OrderItemLine[] }) =>
    request<FreightQuote>("POST", "/freight/quote", body),
  freightQuoteAvailability: () =>
    request<{ loggi?: boolean; melhorenvio?: boolean; reason?: string }>(
      "GET",
      "/freight/quote-availability",
    ),

  globalSearch: (query = "") =>
    request<Record<string, unknown>[]>("GET", withQuery("/search", query)),

  ordersFacets: (query = "") =>
    request<{ statusCounts?: Record<string, number>; tagCounts?: Record<string, number> }>(
      "GET",
      withQuery("/orders/facets", query),
    ),
  listConfig: (system: string) =>
    request<{ system: string; items: ConfigItem[] }>(
      "GET",
      `/config?system=${encodeURIComponent(system)}`,
    ),
  createConfig: (body: Partial<ConfigItem> & { system: string; key: string }) =>
    request<ConfigItem>("POST", "/config", body),
  updateConfig: (id: number | string, body: Partial<ConfigItem>) =>
    request<ConfigItem>("PATCH", `/config/${id}`, body),

  listSystemUsers: () => request<SystemUser[]>("GET", "/system-users"),
  createSystemUser: (body: Partial<SystemUser> & { email: string }) =>
    request<SystemUser>("POST", "/system-users", body),
  updateSystemUser: (id: number, body: Partial<SystemUser>) =>
    request<SystemUser>("PATCH", `/system-users/${id}`, body),
  deleteSystemUser: (id: number) =>
    request<null>("DELETE", `/system-users/${id}`),
  resendSystemUserInvite: (id: number) =>
    request<unknown>("POST", `/system-users/${id}/resend-invite`, {}),

  listServices: (query = "") =>
    request<Service[]>("GET", withQuery("/services", query)),
  createService: (body: Partial<Service>) =>
    request<Service>("POST", "/services", body),
  updateService: (id: number, body: Partial<Service> & { replace_calendar_event?: boolean }) =>
    request<Service>("PATCH", `/services/${id}`, body),
  deleteService: (id: number) =>
    request<null>("DELETE", `/services/${id}`),
  getServicesReport: (query = "") =>
    request<unknown>("GET", withQuery("/services/reports", query)),

  listInstitutionalClients: (query = "") =>
    request<InstitutionalClient[]>("GET", withQuery("/institutional-clients", query)),
  createInstitutionalClient: (body: Partial<InstitutionalClient>) =>
    request<InstitutionalClient>("POST", "/institutional-clients", body),
  updateInstitutionalClient: (id: number, body: Partial<InstitutionalClient>) =>
    request<InstitutionalClient>("PATCH", `/institutional-clients/${id}`, body),
  deleteInstitutionalClient: (id: number) =>
    request<null>("DELETE", `/institutional-clients/${id}`),
  getInstitutionalClient: (id: number) =>
    request<InstitutionalClient>("GET", `/institutional-clients/${id}`),
  getInstitutionalClientByCode: (clientCode: string) =>
    request<InstitutionalClient>(
      "GET",
      `/institutional-clients/by-code/${encodeURIComponent(clientCode)}`,
    ),
  getInstitutionalClientHistory: (id: number) =>
    request<InstitutionalClientHistory>("GET", `/institutional-clients/${id}/history`),

  listProfessionals: (query = "") =>
    request<Professional[]>("GET", withQuery("/professionals", query)),
  createProfessional: (body: Partial<Professional>) =>
    request<Professional>("POST", "/professionals", body),
  updateProfessional: (id: number, body: Partial<Professional>) =>
    request<Professional>("PATCH", `/professionals/${id}`, body),
  deleteProfessional: (id: number) =>
    request<null>("DELETE", `/professionals/${id}`),

  listTags: (query = "") =>
    request<Tag[]>("GET", withQuery("/items/tags", query)),
  createTag: (body: Partial<Tag>) =>
    request<Tag>("POST", "/items/tags", body),
  updateTag: (id: number, body: Partial<Tag>) =>
    request<Tag>("PATCH", `/items/tags/${id}`, body),
  deleteTag: (id: number) => request<null>("DELETE", `/items/tags/${id}`),

  listActivity: (query = "") =>
    request<ActivityItem[]>("GET", withQuery("/activity", query)),

  getAnalyticsAssociates: (query = "") =>
    request<AnalyticsPayload>("GET", withQuery("/analytics/associates", query)),
  getAnalyticsServices: (query = "") =>
    request<AnalyticsPayload>("GET", withQuery("/analytics/services", query)),
  getAnalyticsOrders: (query = "") =>
    request<AnalyticsPayload>("GET", withQuery("/analytics/orders", query)),
  getAnalyticsReception: (query = "") =>
    request<AnalyticsPayload>("GET", withQuery("/analytics/reception", query)),
};

export type OperatorUser = {
  id?: number | string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  permissions?: string[] | string;
  role?: string;
};

export type Associate = {
  id: number;
  user_code?: string | null;
  prescription?: string | number | null;
  associate_name?: string | null;
  associate_last_name?: string | null;
  email_account?: string | null;
  associate_cpf?: string | null;
  associate_status?: string | null;
  status?: string | null;
  city?: string | null;
  state?: string | null;
  mobile_number?: string | null;
  street?: string | null;
  street_number?: string | null;
  neighborhood?: string | null;
  cep?: string | null;
  prescriber?: string | null;
  prescriber_code?: string | null;
  date_prescription?: string | null;
  annotations?: string | unknown[] | null;
};

export type AssociateAnnotation = {
  id: string;
  text: string;
  date_created?: string;
  userName?: string;
};

export type UserHistory = {
  orders?: Order[];
  services?: Service[];
};

export type ServiceFileLink = {
  id: number;
  service_id?: number;
  file_id?: number | string;
};

export type ConfigItem = {
  id: number | string;
  system?: string;
  key?: string;
  value?: string | null;
  description?: string | null;
};

export type SystemUser = {
  id: number;
  email?: string | null;
  name?: string | null;
  last_name?: string | null;
  permissions?: string[] | string | null;
  status?: string | null;
  user_code?: string | null;
};

export type ReceptionFormField = {
  id: string;
  label?: string;
  type?: string;
  required?: boolean;
  options?: Array<string | { label?: string; value?: string; enabled?: boolean }>;
};

export type ReceptionFormSchema = {
  fields?: ReceptionFormField[];
  title?: string;
  subtitle?: string;
  success_message?: string;
};

export type Product = {
  id: number;
  name?: string | null;
  sku?: string | null;
  type?: string | null;
  unit?: string | null;
  concentration?: number | null;
  price?: number | null;
  amount?: number | null;
  category?: string | null;
  batch?: string | null;
  status?: "published" | "draft" | "archived" | string | null;
};

export type OrderItemLine = {
  sku?: string;
  code?: string;
  name?: string;
  quantity: number;
  amount: number;
  batch?: string;
};

export type OrderFile = {
  id: number | string;
  filename?: string | null;
  url?: string | null;
};

export type CustomPaymentLine = {
  item: string;
  qnt: number;
  value: number;
};

export type Order = {
  id: number;
  order_code?: string | null;
  status?: string | null;
  total?: number | null;
  associate_name?: string | null;
  receiver_name?: string | null;
  user_code?: string | null;
  institutional_client_id?: number | null;
  institutional_client_code?: string | null;
  date_created?: string | null;
  items?: OrderItemLine[] | string | null;
  delivery_price?: number | null;
  discount?: number | null;
  donation?: number | null;
  custom_payment?: CustomPaymentLine[] | string | null;
  order_notes?: string | null;
  details?: string | null;
  info?: string | null;
  payment_method?: string | null;
  payment_link?: string | null;
  payment_code?: string | null;
  tracking_code?: string | null;
  display_tracking_code?: string | null;
  freight_carrier?: string | null;
  freight_option?: FreightOption | null;
  files?: OrderFile[];
  address?: unknown;
  tags?: unknown;
  production_owner?: string | null;
};

export type OrderTracking = {
  provider?: string | null;
  tracking_code?: string | null;
  tracking_url?: string | null;
  message?: string | null;
  pending?: boolean;
  package?: unknown;
  shipment?: unknown;
};

export type BulkActionResult = {
  order_id: number;
  ok: boolean;
  error?: string;
  data?: unknown;
};

export type OrdersBulkBody = {
  ids: number[];
  action: "status" | "tags_add" | "tags_remove" | "label_create" | "label_cancel";
  status?: string;
  tags?: string[];
  provider?: "loggi" | "melhorenvio";
};

export type PagarmeStatus = {
  enabled?: boolean;
  use_for_orders?: boolean;
  split_mode?: boolean;
  payment_percentage?: number | null;
  payment_percentage_ok?: boolean;
  credentials_complete?: boolean;
};

export type PagarmeCheckoutResult = {
  payment_link?: string | null;
  payment_code?: string | null;
  split_mode?: boolean;
};

export type FreightAddress = {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep: string;
};

export type FreightOption = {
  option_key?: string;
  provider?: string;
  label?: string;
  price?: number;
  status?: string;
};

export type FreightQuote = {
  apply_to_total?: boolean;
  default_option_key?: string | null;
  selected_option_key?: string | null;
  options?: FreightOption[];
  errors?: Array<{ provider?: string; message?: string }>;
};

export type SystemInvitePreview = {
  email?: string;
  expires_at?: string;
  professional_code?: string | null;
  permissions?: string[];
};

export type CreateOrderBody = {
  user_code?: string;
  user?: number | null;
  institutional_client_id?: number;
  institutional_client_code?: string | null;
  associate_name?: string;
  name_associate?: string;
  receiver_name?: string;
  email?: string;
  items: OrderItemLine[];
  total: number;
  delivery_price?: number;
  discount?: number;
  donation?: number;
  status?: string;
  freight_carrier?: string | null;
  freight_option?: FreightOption | null;
  address?: FreightAddress & { street: string; neighborhood: string; city: string; state: string };
  info?: string;
  custom_payment?: CustomPaymentLine[];
  tags?: string[];
};

export type UserFile = {
  id: number | string;
  filename?: string | null;
  mime_type?: string | null;
  doc_kind?: string | null;
  doc_type?: string | null;
  url?: string | null;
};

export type ReceptionAttendant = {
  id?: number;
  name?: string;
  last_name?: string;
  email?: string | null;
  code?: string;
  utalk_id?: string | null;
};

export type Reception = {
  id: number;
  status?: string | null;
  name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  attendant?: string | null;
  help_topic?: string | null;
  date_created?: string | null;
  message?: string | null;
  chat_id?: string | null;
  associate_code?: string | null;
  associate_name?: string | null;
};

export type Service = {
  id: number;
  name?: string | null;
  type?: string | null;
  status?: string | null;
  price?: number | null;
  price_paid?: number | null;
  donation?: number | null;
  payment_type?: string | null;
  associate_name?: string | null;
  associate_user_code?: string | null;
  professional_name?: string | null;
  professional_id?: string | null;
  consultation_date?: string | null;
  date_created?: string | null;
  observations?: string | null;
  patient_name?: string | null;
  booking_group_code?: string | null;
  tags?: string[] | unknown;
};

export type InstitutionalClient = {
  id: number;
  client_code?: string | null;
  status?: string | null;
  is_company?: boolean | null;
  company_name?: string | null;
  company_trade_name?: string | null;
  company_cnpj?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  representative_name?: string | null;
  representative_last_name?: string | null;
  representative_cpf?: string | null;
  representative_email?: string | null;
  representative_mobile?: string | null;
  street?: string | null;
  street_number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  cep?: string | null;
  city?: string | null;
  state?: string | null;
  display_name?: string | null;
  annotations?: string | unknown[] | null;
  date_created?: string | null;
};

export type InstitutionalClientHistory = {
  orders?: Order[];
};

export type InstitutionalClientAnnotation = {
  id: string;
  text: string;
  date_created?: string;
};

export type Professional = {
  id: number;
  name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  specialty?: string | null;
  type?: string | null;
  professional_code?: string | null;
  active?: boolean | null;
  is_prescriber?: boolean | null;
  city?: string | null;
  state?: string | null;
  consultation_price?: number | null;
};

export type Tag = {
  id: number;
  tag?: string | null;
  contexts?: string | string[] | null;
  color?: string | null;
};

export type ActivityItem = {
  id: number | string;
  date_created?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  entity_code?: string | null;
  action?: string | null;
  summary?: string | null;
  actor_user_code?: string | null;
  actor_name?: string | null;
};

export type AnalyticsSeriesPoint = { name: string; value: number };

export type AnalyticsPayload = {
  period?: { start?: string; end?: string; group_by?: string };
  kpis?: Record<string, number>;
  series?: Record<string, AnalyticsSeriesPoint[]>;
  rankings?: Record<string, Array<{ name: string; value: number; code?: string | null }>>;
};

export function parsePermissions(user?: OperatorUser | null): string[] {
  if (!user?.permissions) return user?.role ? [user.role] : [];
  if (Array.isArray(user.permissions)) return user.permissions.map(String);
  try {
    const parsed = JSON.parse(user.permissions);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* csv */
  }
  return String(user.permissions)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

export function displayName(user?: OperatorUser | null) {
  if (!user) return "";
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return user.name || full || user.email || "Operador";
}
