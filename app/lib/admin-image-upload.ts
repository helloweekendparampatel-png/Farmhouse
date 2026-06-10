import { apiPostForm } from './backend-api';

export type AdminUploadFolder = 'photography' | 'decorations' | 'farms';

type UploadResponse = { files: { url: string }[] };

export async function uploadAdminImageFiles(
  token: string,
  files: File[],
  folder: AdminUploadFolder,
): Promise<string[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  formData.append('folder', folder);
  const res = await apiPostForm<UploadResponse>('/uploads', token, formData);
  return res.files.map((f) => f.url);
}

export async function uploadAdminImageFile(
  token: string,
  file: File,
  folder: AdminUploadFolder,
): Promise<string> {
  const urls = await uploadAdminImageFiles(token, [file], folder);
  return urls[0];
}
