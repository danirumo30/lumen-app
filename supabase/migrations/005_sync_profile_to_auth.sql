-- Trigger para sincronizar user_profiles con auth.users
-- Esto asegura que el avatar esté disponible en user_metadata

CREATE OR REPLACE FUNCTION public.sync_profile_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users user_metadata when user_profiles changes
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'),
    '{avatar_url}',
    to_jsonb(NEW.avatar_url)
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_profile_to_auth_trigger ON public.user_profiles;

CREATE TRIGGER sync_profile_to_auth_trigger
AFTER UPDATE OF avatar_url ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_auth();
