import { redirect } from "next/navigation";

export default function LegacyAdminAccountsPage() {
  redirect("/admin/system/admins");
}
