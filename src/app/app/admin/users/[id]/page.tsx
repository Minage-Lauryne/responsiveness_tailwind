import { UserDetailPage } from "@/features/admin/users/user-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <UserDetailPage userId={id} />;
}
