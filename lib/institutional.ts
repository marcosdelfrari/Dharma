import type { InstitutionalClient, InstitutionalClientAnnotation } from "@/lib/api";

export function isInstitutionalCompany(client: InstitutionalClient | null | undefined) {
  if (!client) return false;
  const flag = client.is_company as boolean | string | number | null | undefined;
  return flag === true || flag === "true" || flag === 1;
}

export function institutionalDisplayName(client: InstitutionalClient | null | undefined) {
  if (!client) return "—";
  if (client.display_name) return String(client.display_name).trim();
  if (isInstitutionalCompany(client)) {
    return (
      String(client.company_trade_name || client.company_name || "").trim() || "—"
    );
  }
  return (
    [client.representative_name, client.representative_last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || "—"
  );
}

export function institutionalStatusLabel(status?: string | null) {
  if (!status) return "—";
  if (status === "active") return "Ativo";
  if (status === "inactive") return "Inativo";
  return status;
}

export function institutionalReceiverName(client: InstitutionalClient | null | undefined) {
  if (!client) return "—";
  return (
    [client.representative_name, client.representative_last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || institutionalDisplayName(client)
  );
}

export function institutionalContactEmail(client: InstitutionalClient | null | undefined) {
  if (!client) return undefined;
  return client.company_email || client.representative_email || undefined;
}

export function institutionalContactPhone(client: InstitutionalClient | null | undefined) {
  if (!client) return undefined;
  return client.company_phone || client.representative_mobile || undefined;
}

export function addressFromInstitutionalClient(client: InstitutionalClient | null) {
  if (!client) return null;
  const cep = String(client.cep || "").replace(/\D/g, "");
  if (cep.length < 8) return null;
  return {
    street: client.street || "",
    number: client.street_number || "",
    neighborhood: client.neighborhood || "",
    city: client.city || "",
    state: client.state || "",
    cep,
  };
}

export function parseInstitutionalAnnotations(
  raw: InstitutionalClient["annotations"],
): InstitutionalClientAnnotation[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as InstitutionalClientAnnotation[];
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
