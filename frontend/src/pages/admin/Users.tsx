import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  UserCog,
  Plus,
  Loader2,
  Edit3,
  ShieldCheck,
  Shield,
  Crown,
  Trash2,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useToast } from "../../components/common/useToast";
import { useAppSelector } from "../../store";
import {
  changeUserPassword,
  createUser,
  deleteUser,
  getUserPassword,
  listUsers,
  updateUser,
  type AdminUser,
  type CreateUserInput,
} from "../../services/usersService";
import type { UserRole } from "../../types";

function roleLabel(role: UserRole) {
  if (role === "super_admin") return "Super Admin (ผู้พัฒนาระบบ)";
  if (role === "admin") return "ครูเรือนพยาบาล (ผู้ดูแลระบบ Admin)";
  return "พี่เลี้ยงเรือนพยาบาล (User)";
}

function isSuperAdmin(user: AdminUser | null) {
  return user?.role === "super_admin";
}

function canViewPassword(viewerRole: UserRole | undefined, target: AdminUser) {
  return viewerRole === "super_admin" || target.role !== "super_admin";
}

export default function AdminUsersPage() {
  const toast = useToast();
  const viewer = useAppSelector((s) => s.auth.user);
  const viewerRole = viewer?.role;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, string | null | undefined>
  >({});
  const [passwordLoading, setPasswordLoading] = useState<Record<string, boolean>>(
    {},
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await listUsers());
    } catch {
      toast("โหลดรายชื่อผู้ใช้ไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePassword(user: AdminUser) {
    if (visiblePasswords[user.id] !== undefined) {
      setVisiblePasswords((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      return;
    }

    setPasswordLoading((prev) => ({ ...prev, [user.id]: true }));
    try {
      const password = await getUserPassword(user.id);
      setVisiblePasswords((prev) => ({ ...prev, [user.id]: password }));
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "ไม่สามารถดูรหัสผ่านได้";
      toast(message, "error");
    } finally {
      setPasswordLoading((prev) => ({ ...prev, [user.id]: false }));
    }
  }

  async function handleDeleteUser() {
    if (!deleting) return;
    try {
      await deleteUser(deleting.id);
      toast("ลบผู้ใช้งานเรียบร้อย", "success");
      setDeleting(null);
      await load();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "ลบผู้ใช้งานไม่สำเร็จ";
      toast(message, "error");
    }
  }

  return (
    <>
      <PageHeader
        title="จัดการผู้ใช้"
        description={`ทั้งหมด ${users.length} คน`}
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> เพิ่มผู้ใช้
          </button>
        }
      />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>ชื่อ-สกุล</th>
                <th>username</th>
                <th>บทบาท</th>
                <th>สถานะ</th>
                <th>รหัสผ่าน</th>
                <th>สร้างเมื่อ</th>
                <th className="text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-6 text-center">
                    <Loader2 className="inline h-5 w-5 animate-spin text-ksp-blue-500" />
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.fullName}</td>
                    <td className="font-mono text-xs">{u.username}</td>
                    <td>
                      {u.role === "super_admin" ? (
                        <span className="chip-blue">
                          <Crown className="h-3 w-3" /> {roleLabel(u.role)}
                        </span>
                      ) : u.role === "admin" ? (
                        <span className="chip-emerald">
                          <ShieldCheck className="h-3 w-3" /> {roleLabel(u.role)}
                        </span>
                      ) : (
                        <span className="chip-slate">
                          <Shield className="h-3 w-3" /> {roleLabel(u.role)}
                        </span>
                      )}
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="chip-emerald">ใช้งาน</span>
                      ) : (
                        <span className="chip-rose">ปิดใช้งาน</span>
                      )}
                    </td>
                    <td>
                      {canViewPassword(viewerRole, u) ? (
                        <div className="inline-flex items-center gap-2">
                          {visiblePasswords[u.id] !== undefined ? (
                            <code className="rounded-md bg-ksp-blue-50 px-2 py-1 text-xs font-semibold text-ksp-navy">
                              {visiblePasswords[u.id] || "ไม่มีข้อมูลรหัสเดิม"}
                            </code>
                          ) : (
                            <span className="text-xs text-ksp-gray">ปิดไว้</span>
                          )}
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1.5"
                            onClick={() => togglePassword(u)}
                            title={
                              visiblePasswords[u.id] !== undefined
                                ? "ปิดรหัสผ่าน"
                                : "ดูรหัสผ่าน"
                            }
                            disabled={passwordLoading[u.id]}
                          >
                            {passwordLoading[u.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : visiblePasswords[u.id] !== undefined ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-ksp-gray">
                          ไม่แสดง
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-ksp-gray">
                      {new Date(u.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="text-right">
                      {isSuperAdmin(u) ? (
                        <span className="text-xs font-medium text-ksp-gray">
                          บัญชีหลักของระบบ
                        </span>
                      ) : (
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1.5"
                            onClick={() => {
                              setEditing(u);
                              setOpen(true);
                            }}
                            title="แก้ไข"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          {u.id !== viewer?.id && (
                            <button
                              type="button"
                              className="btn-ghost px-2 py-1.5 text-rose-600 hover:bg-rose-50"
                              onClick={() => setDeleting(u)}
                              title="ลบผู้ใช้งาน"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && users.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={<UserCog className="h-7 w-7" />}
              title="ยังไม่มีผู้ใช้อื่น"
              description="กดปุ่ม 'เพิ่มผู้ใช้' เพื่อสร้างบัญชีครูเรือนพยาบาลหรือพี่เลี้ยงเรือนพยาบาลเพิ่ม"
            />
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `แก้ไขผู้ใช้: ${editing.username}` : "เพิ่มผู้ใช้ใหม่"}
        size="md"
      >
        <UserForm
          editing={editing}
          viewerRole={viewerRole}
          onCancel={() => setOpen(false)}
          onSubmit={async (data) => {
            try {
              if (editing) {
                await updateUser(editing.id, {
                  fullName: data.fullName,
                  role: data.role,
                });
                toast("อัปเดตผู้ใช้เรียบร้อย", "success");
              } else {
                await createUser(data);
                toast("เพิ่มผู้ใช้เรียบร้อย", "success");
              }
              setOpen(false);
              await load();
            } catch (err) {
              const m =
                (err as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ?? "บันทึกไม่สำเร็จ";
              toast(m, "error");
            }
          }}
          onChangePassword={
            editing
              ? async (currentPassword, newPassword) => {
                  try {
                    await changeUserPassword(
                      editing.id,
                      currentPassword,
                      newPassword,
                    );
                    setVisiblePasswords((prev) => ({
                      ...prev,
                      [editing.id]: newPassword,
                    }));
                    toast("เปลี่ยนรหัสผ่านเรียบร้อย", "success");
                  } catch (err) {
                    const message =
                      (err as { response?: { data?: { message?: string } } })
                        ?.response?.data?.message ?? "เปลี่ยนรหัสผ่านไม่สำเร็จ";
                    toast(message, "error");
                    throw err;
                  }
                }
              : undefined
          }
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="ยืนยันการลบผู้ใช้งาน"
        message={`ต้องการลบผู้ใช้งาน ${deleting?.fullName ?? ""} ใช่หรือไม่? บัญชีนี้จะไม่สามารถเข้าสู่ระบบได้อีก`}
        confirmLabel="ลบผู้ใช้งาน"
        danger
        onConfirm={handleDeleteUser}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

function UserForm({
  editing,
  viewerRole,
  onSubmit,
  onCancel,
  onChangePassword,
}: {
  editing: AdminUser | null;
  viewerRole: UserRole | undefined;
  onSubmit: (data: CreateUserInput) => Promise<void> | void;
  onCancel: () => void;
  onChangePassword?: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void> | void;
}) {
  const [username, setUsername] = useState(editing?.username ?? "");
  const [fullName, setFullName] = useState(editing?.fullName ?? "");
  const [role, setRole] = useState<UserRole>(editing?.role ?? "nurse_assistant");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const canChangePassword =
    Boolean(editing) &&
    Boolean(onChangePassword) &&
    (viewerRole === "super_admin" || editing?.role !== "super_admin");

  async function handle(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ username, password, fullName, role });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (!onChangePassword) return;
    setChangingPassword(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      // Error toast is shown by the parent so the form can keep the typed values.
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handle} className="space-y-4">
        <div>
          <label className="label">ชื่อ-สกุล *</label>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">username *</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={Boolean(editing)}
          />
        </div>
        {!editing && (
          <div>
            <label className="label">รหัสผ่านเริ่มต้น *</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 8 ตัวอักษร"
              minLength={8}
              required
            />
          </div>
        )}
        <div>
          <label className="label">บทบาท *</label>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={editing?.role === "super_admin"}
          >
            <option value="super_admin" disabled>
              Super Admin (ผู้พัฒนาระบบ)
            </option>
            <option value="admin">
              ครูเรือนพยาบาล (ผู้ดูแลระบบ Admin)
            </option>
            <option value="nurse_assistant">
              พี่เลี้ยงเรือนพยาบาล (User)
            </option>
          </select>
          <p className="mt-1 text-xs text-ksp-gray">
            บทบาท Super Admin เป็นบัญชีหลักของระบบ แสดงไว้เท่านั้นและไม่สามารถเลือกเพิ่มได้
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </form>

      {editing && (
        <div className="rounded-xl border border-ksp-blue-100 bg-ksp-blue-50/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ksp-navy">
            <LockKeyhole className="h-4 w-4" /> เปลี่ยนรหัสผ่าน
          </div>
          {canChangePassword ? (
            <form onSubmit={handleChangePassword} className="mt-3 space-y-3">
              <div>
                <label className="label">รหัสผ่านเดิม *</label>
                <input
                  type="password"
                  className="input bg-white"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">รหัสผ่านใหม่ *</label>
                <input
                  type="password"
                  className="input bg-white"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={changingPassword}
                >
                  {changingPassword ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-2 text-xs text-ksp-gray">
              ไม่สามารถเปลี่ยนรหัสผ่านบัญชีผู้พัฒนาระบบได้
            </p>
          )}
        </div>
      )}
    </div>
  );
}
