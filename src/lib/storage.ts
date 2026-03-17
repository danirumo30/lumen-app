import { getSupabaseClient } from "./supabase";

/**
 * Sube un archivo a Supabase Storage y devuelve la URL pública
 */
export async function uploadFile(
  file: File,
  bucket: string = "profile-images",
  path: string,
): Promise<string> {
  const supabase = getSupabaseClient();
  
  // Verificar que el archivo es una imagen
  if (!file.type.startsWith("image/")) {
    throw new Error("Solo se permiten archivos de imagen");
  }

  // Verificar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La imagen no puede pesar más de 5MB");
  }

  // Subir archivo
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }

  console.log("Upload successful, data:", data);

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  console.log("Public URL:", urlData.publicUrl);
  return urlData.publicUrl;
}

/**
 * Genera un nombre de archivo único para evitar colisiones
 */
export function generateUniqueFileName(
  userId: string,
  type: "avatar" | "banner",
  originalName: string,
): string {
  const timestamp = Date.now();
  const extension = originalName.split(".").pop();
  return `${userId}/${type}/${timestamp}.${extension}`;
}

/**
 * Valida el tipo de archivo
 */
export function validateImageFile(file: File): boolean {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  return allowedTypes.includes(file.type);
}
