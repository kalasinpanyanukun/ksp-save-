import { api } from "./api";
import type { InfirmaryDocument } from "../types";

export interface CreateDocumentInput {
  title: string;
  description?: string;
  file: File;
}

export async function listInfirmaryDocuments(): Promise<InfirmaryDocument[]> {
  const { data } = await api.get<{ data: InfirmaryDocument[] }>("/infirmary-documents");
  return data.data;
}

export async function createInfirmaryDocument({
  title,
  description,
  file,
}: CreateDocumentInput): Promise<InfirmaryDocument> {
  const { data } = await api.post<{ document: InfirmaryDocument }>(
    "/infirmary-documents",
    file,
    {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "X-File-Name": encodeURIComponent(file.name),
        "X-Document-Title": encodeURIComponent(title),
        "X-Document-Description": encodeURIComponent(description ?? ""),
      },
    },
  );
  return data.document;
}
