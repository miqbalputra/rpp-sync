// Form fields User (dipakai halaman baru & edit).
import { FieldLabel, inputClass, Button, CancelLink } from "@/components/admin/ui";
import { Role, Gender } from "@prisma/client";

export default function UserForm({
  action,
  defaultValues,
  isEdit = false,
}: {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    nama?: string;
    email?: string;
    username?: string;
    role?: Role;
    gender?: Gender | null;
    aktif?: boolean;
  };
  isEdit?: boolean;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="nama">Nama Lengkap</FieldLabel>
          <input id="nama" name="nama" required defaultValue={defaultValues?.nama} autoFocus className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <input id="username" name="username" required defaultValue={defaultValues?.username} className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <input id="email" name="email" type="email" required defaultValue={defaultValues?.email} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="password">
            Password {isEdit && <span className="text-gray-400 font-normal dark:text-gray-500">(kosongkan jika tidak ganti)</span>}
          </FieldLabel>
          <input
            id="password"
            name="password"
            type="password"
            {...(isEdit ? {} : { required: true })}
            className={inputClass}
            placeholder={isEdit ? "•••••• (biarkan kosong)" : "minimal 6 karakter"}
          />
        </div>
        <div>
          <FieldLabel htmlFor="role">Role</FieldLabel>
          <select id="role" name="role" defaultValue={defaultValues?.role ?? "GURU"} className={inputClass}>
            <option value="GURU">Guru Mapel</option>
            <option value="PJ_DINIYYAH">PJ Diniyyah (Kurikulum)</option>
            <option value="KEPALA_SEKOLAH">Kepala Sekolah</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="gender">Gender</FieldLabel>
          <select id="gender" name="gender" defaultValue={defaultValues?.gender ?? ""} className={inputClass}>
            <option value="">— pilih —</option>
            <option value="IKHWAN">Ikhwan</option>
            <option value="AKHWAT">Akhwat</option>
          </select>
        </div>
        <div className="md:col-span-2 flex items-center gap-2 pt-1">
          <input
            id="aktif"
            name="aktif"
            type="checkbox"
            defaultChecked={defaultValues?.aktif ?? true}
            className="h-4 w-4 rounded border-border text-primary focus:ring-ring accent-primary"
          />
          <label htmlFor="aktif" className="text-sm text-foreground">Akun aktif</label>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Simpan</Button>
        <CancelLink href="/admin/users" />
      </div>
    </form>
  );
}