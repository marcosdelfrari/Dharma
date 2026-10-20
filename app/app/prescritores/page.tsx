import { redirect } from "next/navigation";
import { PATHS } from "@/lib/menu";

export default function PrescritoresRedirectPage() {
  redirect(PATHS.professionals);
}
