"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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

      // Update profile with uploaded images
      await repository.updateProfile(user.id, {
        avatarUrl: avatarPreview || formData.avatarUrl || null,
        bannerUrl: bannerPreview || formData.bannerUrl || null,
        username: formData.username,
      });

      // Note: We only update user_profiles table here.
      // The AuthContext will read from user_profiles when needed.
      // This ensures data persists correctly across sessions.

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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-24">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-white mb-8">Editar Perfil</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-400 mb-3">
                Nombre de usuario
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                placeholder="username"
                required
                minLength={3}
              />
              <p className="mt-2 text-xs text-zinc-500">
                Mínimo 3 caracteres, solo letras, números y guiones bajos.
              </p>
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-3">
                Foto de perfil
              </label>
              <input
                type="file"
                ref={avatarInputRef}
                onChange={(e) => handleFileSelect(e, "avatar")}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
              />
              <div className="flex items-center gap-5">
                <div
                  className="w-24 h-24 rounded-full bg-zinc-800 bg-cover bg-center cursor-pointer border-2 border-dashed border-zinc-600 hover:border-indigo-500 transition-all relative overflow-hidden group"
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
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 transition-colors">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => triggerFileInput("avatar")}
                    className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Elegir imagen
                  </button>
                  <p className="mt-2 text-xs text-zinc-500">
                    JPG, PNG o WebP (máx 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-3">
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
                className="h-40 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-cover bg-center cursor-pointer border-2 border-dashed border-zinc-600 hover:border-indigo-500 transition-all relative overflow-hidden group"
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
                  <div className="w-full h-full flex items-center justify-center text-white/70 group-hover:text-white/90 transition-colors">
                    <svg
                      className="w-6 h-6 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Subir banner</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent group-hover:from-black/40 transition-colors" />
                <div className="absolute bottom-3 right-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFileInput("banner");
                    }}
                    className="px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white/90 hover:text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                JPG, PNG o WebP (máx 5MB)
              </p>
            </div>

            {/* Preview */}
            <div className="pt-6 border-t border-zinc-800/50">
              <h2 className="text-lg font-medium text-white mb-4">Vista previa</h2>
              <div className="relative h-40 rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600">
                {(bannerPreview || formData.bannerUrl) && (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${bannerPreview || formData.bannerUrl})`,
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full border-3 border-white bg-zinc-800 bg-cover bg-center shadow-lg"
                    style={{
                      backgroundImage: avatarPreview
                        ? `url(${avatarPreview})`
                        : formData.avatarUrl
                        ? `url(${formData.avatarUrl})`
                        : undefined,
                    }}
                  />
                  <div>
                    <span className="text-white font-medium text-lg">
                      {formData.username || "usuario"}
                    </span>
                    <p className="text-white/70 text-sm">Usuario de Lumen</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 flex gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-colors"
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
