// Edit User.
import { prisma } from "@/lib/db";
import { updateUser } from "../../actions";
import UserForm from "../../_UserForm";
import { PageHeader, Card, ErrorBanner } from "@/components/admin/ui";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit User — Admin" };

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit User" />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      <Card className="p-5">
        <UserForm
          action={updateUser.bind(null, id)}
          isEdit
          defaultValues={{
            nama: user.nama,
            email: user.email,
            username: user.username,
            role: user.role,
            gender: user.gender,
            aktif: user.aktif,
          }}
        />
      </Card>
    </div>
  );
}