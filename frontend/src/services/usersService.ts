import { api } from "./api";
import type { UserRole } from "../types";

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface UpdateUserInput {
  fullName?: string;
  role?: UserRole;
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data } = await api.get<{ data: AdminUser[] }>("/users");
  return data.data;
}

export async function createUser(payload: CreateUserInput): Promise<AdminUser> {
  const { data } = await api.post<{ user: AdminUser }>("/users", payload);
  return data.user;
}

export async function updateUser(
  id: string,
  payload: UpdateUserInput,
): Promise<AdminUser> {
  const { data } = await api.put<{ user: AdminUser }>(`/users/${id}`, payload);
  return data.user;
}

export async function getUserPassword(id: string): Promise<string | null> {
  const { data } = await api.get<{ password: string | null }>(
    `/users/${id}/password`,
  );
  return data.password;
}

export async function changeUserPassword(
  id: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post(`/users/${id}/change-password`, {
    currentPassword,
    newPassword,
  });
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function changeMyPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post("/users/me/change-password", { currentPassword, newPassword });
}
