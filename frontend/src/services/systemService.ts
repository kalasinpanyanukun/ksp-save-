import { api } from "./api";

export interface SystemStatus {
  database: {
    usedBytes: number;
    totalBytes: number;
    usedPct: number;
    limitMb: number;
  };
  activeUsers: {
    id: string;
    fullName: string;
    username: string;
    role: string;
    lastSeenAt: string;
  }[];
  activeWindowMin: number;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const { data } = await api.get<SystemStatus>("/system/status");
  return data;
}
