"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

import { SupabaseUserProfileRepository } from "@/modules/social/infrastructure/repositories/supabase-user-profile.repository";
import { getSupabaseClient } from "@/lib/supabase";
import { uploadFile, generateUniqueFileName, validateImageFile } from "@/lib/storage";
import type { UpdateProfileData, UserProfile } from "@/modules/social/domain/user-profile";

export default function ProfileEditPage() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateProfileData>({
    avatarUrl: "",
    bannerUrl: "",
    username: "",
  });

  const [originalData, setOriginalData] = useState<UserProfile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = getSupabaseClient();
        const repository = new SupabaseUserProfileRepository(supabase);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const profile = await repository.getProfileById(user.id);

        if (!profile) {
          setError("Perfil no encontrado");
          return;
        }

        setOriginalData(profile);
        setFormData({
          avatarUrl: profile.avatarUrl || "",
          bannerUrl: profile.bannerUrl || "",
          username: profile.username,
        });
      } catch (err) {
        setError("Error al cargar el perfil");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar archivo
    if (!validateImageFile(file)) {
      setError("Formato de imagen no válido. Usa JPG, PNG o WebP.");
      return;
    }

    // Validar tamaño
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede pesar más de 5MB.");
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Generar nombre de archivo único
      const filePath = generateUniqueFileName(user.id, type, file.name);

      // Subir archivo
      const publicUrl = await uploadFile(file, "profile-images", filePath);

      // Actualizar preview y formData
      if (type === "avatar") {
        setAvatarPreview(URL.createObjectURL(file));
        setFormData((prev) => ({ ...prev, avatarUrl: publicUrl }));
      } else {
        setBannerPreview(URL.createObjectURL(file));
        setFormData((prev) => ({ ...prev, bannerUrl: publicUrl }));
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
      console.error(err);
    }
  };

  const triggerFileInput = (type: "avatar" | "banner") => {
    if (type === "avatar") {
      avatarInputRef.current?.click();
    } else {
      bannerInputRef.current?.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = getSupabaseClient();
      const repository = new SupabaseUserProfileRepository(supabase);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Validate username availability if changed
      if (formData.username !== originalData?.username) {
        const isAvailable = await repository.isUsernameAvailable(
          formData.username!,
          user.id,
        );

        if (!isAvailable) {
          throw new Error("El nombre de usuario ya está en uso");
        }
      }

      // Update profile
      await repository.updateProfile(user.id, {
        avatarUrl: avatarPreview || formData.avatarUrl || null,
        bannerUrl: bannerPreview || formData.bannerUrl || null,
        username: formData.username,
      });

      setSuccess("Perfil actualizado correctamente");
      setOriginalData({ ...originalData!, ...formData });

      // Clear previews
      setAvatarPreview(null);
      setBannerPreview(null);

      // Redirect to profile page after 2 seconds
      setTimeout(() => {
        router.push(`/profile/${formData.username}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el perfil");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-card rounded-lg shadow-sm border border-border p-8">
          <h1 className="text-2xl font-bold mb-8">Editar Perfil</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Nombre de usuario
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="username"
                required
                minLength={3}
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Mínimo 3 caracteres, solo letras, números y guiones bajos.
              </p>
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Foto de perfil
              </label>
              <input
                type="file"
                ref={avatarInputRef}
                onChange={(e) => handleFileSelect(e, "avatar")}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
              />
              <div className="flex items-center gap-4">
                <div
                  className="w-24 h-24 rounded-full bg-gray-200 bg-cover bg-center cursor-pointer border-2 border-dashed border-gray-400 hover:border-purple-500 transition-colors"
                  style={{
                    backgroundImage: avatarPreview
                      ? `url(${avatarPreview})`
                      : formData.avatarUrl
                      ? `url(${formData.avatarUrl})`
                      : undefined,
                  }}
                  onClick={() => triggerFileInput("avatar")}
                >
                  {!avatarPreview && !formData.avatarUrl && (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => triggerFileInput("avatar")}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Elegir imagen
                  </button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG o WebP (máx 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Banner
              </label>
              <input
                type="file"
                ref={bannerInputRef}
                onChange={(e) => handleFileSelect(e, "banner")}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
              />
              <div
                className="h-32 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 bg-cover bg-center cursor-pointer border-2 border-dashed border-gray-400 hover:border-purple-500 transition-colors relative overflow-hidden"
                style={{
                  backgroundImage: bannerPreview
                    ? `url(${bannerPreview})`
                    : formData.bannerUrl
                    ? `url(${formData.bannerUrl})`
                    : undefined,
                }}
                onClick={() => triggerFileInput("banner")}
              >
                {!bannerPreview && !formData.bannerUrl && (
                  <div className="w-full h-full flex items-center justify-center text-white/70">
                    <svg
                      className="w-8 h-8 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Subir banner</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-2 right-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFileInput("banner");
                    }}
                    className="px-3 py-1 bg-black/50 text-white rounded text-xs hover:bg-black/70 transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG o WebP (máx 5MB)
              </p>
            </div>

            {/* URL Inputs (opcional para enlaces externos) */}
            <div className="pt-4 border-t border-border space-y-4">
              <p className="text-sm text-muted-foreground">
                O alternativamente, puedes usar URLs externas:
              </p>
              <div>
                <label htmlFor="avatarUrl" className="block text-sm font-medium mb-2">
                  URL de foto de perfil
                </label>
                <input
                  type="url"
                  id="avatarUrl"
                  name="avatarUrl"
                  value={formData.avatarUrl || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div>
                <label htmlFor="bannerUrl" className="block text-sm font-medium mb-2">
                  URL de banner
                </label>
                <input
                  type="url"
                  id="bannerUrl"
                  name="bannerUrl"
                  value={formData.bannerUrl || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="pt-6 border-t border-border">
              <h2 className="text-lg font-medium mb-4">Vista previa</h2>
              <div className="relative h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg overflow-hidden">
                {(bannerPreview || formData.bannerUrl) && (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${bannerPreview || formData.bannerUrl})`,
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full border-2 border-white bg-gray-200 bg-cover bg-center"
                    style={{
                      backgroundImage: avatarPreview
                        ? `url(${avatarPreview})`
                        : formData.avatarUrl
                        ? `url(${formData.avatarUrl})`
                        : undefined,
                    }}
                  />
                  <span className="text-white font-medium">{formData.username || "usuario"}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
