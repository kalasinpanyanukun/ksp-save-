import { randomUUID } from "node:crypto";
import { extname } from "node:path";

interface StorageConfig {
  url: string;
  key: string;
}

const ensuredBuckets = new Set<string>();

export const STUDENT_PHOTOS_BUCKET =
  process.env.SUPABASE_STUDENT_PHOTOS_BUCKET ?? "student-photos";

function inferSupabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const match = databaseUrl.match(/postgres\.([a-z0-9]+)\./i);
  return match ? `https://${match[1]}.supabase.co` : "";
}

function storageConfig(): StorageConfig {
  const url = (
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    inferSupabaseUrl()
  ).replace(/\/+$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_STORAGE_KEY ??
    "";

  if (!url || !key) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY สำหรับอัปโหลดไฟล์",
    );
  }
  return { url, key };
}

function storageHeaders(config: StorageConfig) {
  return {
    apikey: config.key,
    authorization: `Bearer ${config.key}`,
  };
}

function encodeObjectPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function safeFileName(name: string) {
  const cleaned = name
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|#%{}^~\[\]`]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || `file-${Date.now()}`;
}

export function objectPath(prefix: string, fileName: string) {
  const ext = extname(fileName);
  const base = safeFileName(fileName.replace(ext, "")).slice(0, 80);
  const suffix = ext ? ext.toLowerCase() : "";
  return `${prefix}/${Date.now()}-${randomUUID()}-${base}${suffix}`;
}

export async function ensureBucket(bucketId: string, publicAccess = true) {
  if (ensuredBuckets.has(bucketId)) return;
  const config = storageConfig();
  const headers = storageHeaders(config);
  const read = await fetch(`${config.url}/storage/v1/bucket/${bucketId}`, {
    headers,
  });
  if (read.ok) {
    ensuredBuckets.add(bucketId);
    return;
  }
  if (read.status !== 404) {
    throw new Error(`ตรวจสอบ bucket ${bucketId} ไม่สำเร็จ`);
  }

  const create = await fetch(`${config.url}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      id: bucketId,
      name: bucketId,
      public: publicAccess,
    }),
  });
  if (!create.ok && create.status !== 409) {
    const message = await create.text().catch(() => "");
    throw new Error(message || `สร้าง bucket ${bucketId} ไม่สำเร็จ`);
  }
  ensuredBuckets.add(bucketId);
}

export async function uploadObject({
  bucketId,
  path,
  buffer,
  contentType,
}: {
  bucketId: string;
  path: string;
  buffer: Buffer;
  contentType: string;
}) {
  const config = storageConfig();
  await ensureBucket(bucketId, true);
  const encodedPath = encodeObjectPath(path);
  const body = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
  const upload = await fetch(
    `${config.url}/storage/v1/object/${bucketId}/${encodedPath}`,
    {
      method: "POST",
      headers: {
        ...storageHeaders(config),
        "cache-control": "3600",
        "content-type": contentType,
        "x-upsert": "true",
      },
      body,
    },
  );
  if (!upload.ok) {
    const message = await upload.text().catch(() => "");
    throw new Error(message || "อัปโหลดไฟล์ไปยัง Supabase Storage ไม่สำเร็จ");
  }
  return {
    path,
    url: `${config.url}/storage/v1/object/public/${bucketId}/${encodedPath}`,
  };
}
