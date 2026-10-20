import { redirect } from "next/navigation";
import { PATHS } from "@/lib/menu";

export default function AppIndex() {
  redirect(PATHS.associates);
}
