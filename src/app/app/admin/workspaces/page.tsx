import { redirect } from "next/navigation";

export default function AdminWorkspacesPage() {
  // Workspaces have been migrated to organizations
  redirect("/app/admin/organizations");
}
