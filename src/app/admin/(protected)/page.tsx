import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";

export default function AdminPage() {
  redirect(ROUTES.ADMIN.DASHBOARD);
}
