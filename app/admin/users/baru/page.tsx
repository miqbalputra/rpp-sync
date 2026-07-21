// Tambah User.
import { createUser } from "../actions";
import UserForm from "../_UserForm";
import { PageHeader, Card, ErrorBanner } from "@/components/admin/ui";

export const metadata = { title: "Tambah User — Admin" };

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="max-w-2xl">
      <PageHeader title="Tambah User" />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      <Card className="p-5">
        <UserForm action={createUser} />
      </Card>
    </div>
  );
}