import { PATHS } from "@/lib/menu";

const STAFF_FOR_PRO = ["Administrador", "Acolhimento", "Produção", "Financeiro"];

export function isProfessionalOnly(roles: string[] = []) {
  return (
    roles.includes("Profissional") &&
    !roles.some((r) => STAFF_FOR_PRO.includes(r))
  );
}

/** Landing pós-login (paridade com apps/kunk roleRedirect). */
export function roleHomePath(roles: string[] = []) {
  if (isProfessionalOnly(roles)) {
    return PATHS.professionalServicesReport;
  }
  if (roles.includes("Produção") && !roles.includes("Administrador")) {
    return PATHS.orders;
  }
  if (roles.includes("Acolhimento") && !roles.includes("Administrador")) {
    return PATHS.triage;
  }
  return PATHS.associates;
}
