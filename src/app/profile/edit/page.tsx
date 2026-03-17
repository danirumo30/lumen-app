"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

import { SupabaseUserProfileRepository } from "@/modules/social/infrastructure/repositories/supabase-user-profile.repository";
import { getSupabaseClient } from "@/lib/supabase";
import type { UpdateProfileData, UserProfile } from "@/modules/social/domain/user-profile";

export default function ProfileEditPage() {
  const router = useRouter();
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
        avatarUrl: formData.avatarUrl || null,
        bannerUrl: formData.bannerUrl || null,
        username: formData.username,
      });

      setSuccess("Perfil actualizado correctamente");
      setOriginalData({ ...originalData!, ...formData });

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

            {/* Avatar URL */}
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
              <p className="mt-1 text-sm text-muted-foreground">
                Deja vacío para usar el avatar predeterminado.
              </p>
            </div>

            {/* Banner URL */}
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
              <p className="mt-1 text-sm text-muted-foreground">
                Deja vacío para usar el gradiente predeterminado.
              </p>
            </div>

            {/* Preview */}
            <div className="pt-6 border-t border-border">
              <h2 className="text-lg font-medium mb-4">Vista previa</h2>
              <div className="relative h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg overflow-hidden">
                {formData.bannerUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${formData.bannerUrl})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full border-2 border-white bg-gray-200 bg-cover bg-center"
                    style={{ backgroundImage: formData.avatarUrl ? `url(${formData.avatarUrl})` : undefined }}
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
