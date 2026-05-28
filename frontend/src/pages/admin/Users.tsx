import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  UserCog,
  Plus,
  Loader2,
  Edit3,
  KeyRound,
  ShieldCheck,
  Shield,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import { useToast } from "../../components/common/useToast";
import {
  createUser,
  listUsers,
  resetUserPassword,
  updateUser,
  type AdminUser,
  type CreateUserInput,
} from "../../services/usersService";
import type { UserRole } from "../../types";

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState<AdminUser | null>(null);

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
                <th>สร้างเมื่อ</th>
                <th className="text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-6">
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
                      {u.role === "admin" ? (
                        <span className="chip-blue">
                          <ShieldCheck className="h-3 w-3" /> Super Admin
                        </span>
                      ) : (
                        <span className="chip-slate">
                          <Shield className="h-3 w-3" /> พี่เลี้ยง
                        </span>
                      )}
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="chip-emerald">ใช้งาน</span>
                      ) : (
                        <span className="chip-rose">ระงับ</span>
                      )}
                    </td>
                    <td className="text-xs text-ksp-gray">
                      {new Date(u.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="text-right">
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
                        <button
                          type="button"
                          className="btn-ghost px-2 py-1.5"
                          onClick={() => setResetting(u)}
                          title="รีเซ็ตรหัสผ่าน"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                      </div>
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
              description="กดปุ่ม 'เพิ่มผู้ใช้' เพื่อสร้างบัญชีพี่เลี้ยงหรือ admin เพิ่ม"
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
                (err as { response?: { data?: { message?: string } } })?.response
                  ?.data?.message ?? "บันทึกไม่สำเร็จ";
              toast(m, "error");
            }
          }}
          onToggleActive={
            editing
              ? async () => {
                  try {
                    await updateUser(editing.id, { isActive: !editing.isActive });
                    toast(
                      editing.isActive
                        ? "ระงับการใช้งานเรียบร้อย"
                        : "เปิดใช้งานเรียบร้อย",
                      "success",
                    );
                    setOpen(false);
                    await load();
                  } catch {
                    toast("ดำเนินการไม่สำเร็จ", "error");
                  }
                }
              : undefined
          }
        />
      </Modal>

      <Modal
        open={Boolean(resetting)}
        onClose={() => setResetting(null)}
        title={`รีเซ็ตรหัสผ่าน: ${resetting?.username ?? ""}`}
        size="sm"
      >
        {resetting && (
          <ResetForm
            onCancel={() => setResetting(null)}
            onSubmit={async (pw) => {
              try {
                await resetUserPassword(resetting.id, pw);
                toast("รีเซ็ตรหัสผ่านเรียบร้อย", "success");
                setResetting(null);
              } catch (err) {
                const m =
                  (err as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ?? "รีเซ็ตไม่สำเร็จ";
                toast(m, "error");
              }
            }}
          />
        )}
      </Modal>
    </>
  );
}

function UserForm({
  editing,
  onSubmit,
  onCancel,
  onToggleActive,
}: {
  editing: AdminUser | null;
  onSubmit: (data: CreateUserInput) => Promise<void> | void;
  onCancel: () => void;
  onToggleActive?: () => void;
}) {
  const [username, setUsername] = useState(editing?.username ?? "");
  const [fullName, setFullName] = useState(editing?.fullName ?? "");
  const [role, setRole] = useState<UserRole>(editing?.role ?? "nurse_assistant");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ username, password, fullName, role });
    } finally {
      setSubmitting(false);
    }
  }
  return (
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
        >
          <option value="nurse_assistant">พี่เลี้ยงเรือนพยาบาล</option>
          <option value="admin">Super Admin</option>
        </select>
      </div>

      <div className="flex justify-between gap-2 pt-2">
        {editing && onToggleActive ? (
          <button
            type="button"
            className={editing.isActive ? "btn-danger" : "btn-outline"}
            onClick={onToggleActive}
          >
            {editing.isActive ? "ระงับการใช้งาน" : "เปิดใช้งาน"}
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button type="button" className="btn-outline" onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </form>
  );
}

function ResetForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (newPassword: string) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [pw, setPw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function handle(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(pw);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form onSubmit={handle} className="space-y-4">
      <div>
        <label className="label">รหัสผ่านใหม่ *</label>
        <input
          type="password"
          className="input"
          minLength={8}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="อย่างน้อย 8 ตัวอักษร"
          required
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-outline" onClick={onCancel}>
          ยกเลิก
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "รีเซ็ต"}
        </button>
      </div>
    </form>
  );
}
