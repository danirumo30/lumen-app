import { getSupabaseClient } from "@/infrastructure/supabase/client";


export async function uploadFile(
  file: File,
  bucket: string = "profile-images",
  path: string,
): Promise<string> {
  const supabase = getSupabaseClient();
  
  
  if (!file.type.startsWith("image/")) {
    throw new Error("Solo se permiten archivos de imagen");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La imagen no puede pesar más de 5MB");
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Error al subir imagen: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return urlData.publicUrl;
}


export function generateUniqueFileName(
  userId: string,
  type: "avatar" | "banner",
  originalName: string,
): string {
  const timestamp = Date.now();
  const extension = originalName.split(".").pop();
  return `${userId}/${type}/${timestamp}.${extension}`;
}


export function validateImageFile(file: File): boolean {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  return allowedTypes.includes(file.type);
}






