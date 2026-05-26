import {
  api,
  REFRESH_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from "./api";
import type { AuthUser, LoginResponse } from "../types";

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    username,
    password,
  });
  localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
  localStorage.setItem(REFRESH_STORAGE_KEY, data.refreshToken);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<{ user: AuthUser }>("/auth/me");
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // ignore
  } finally {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function loadStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function hasToken(): boolean {
  return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
}
