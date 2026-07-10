
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- has_role must remain callable from RLS policies (evaluated as authenticated via SECURITY DEFINER of policy owner). Policies call it with definer rights, so revoking direct EXECUTE from authenticated is fine — policies still work because policies execute as table owner. Grant back to authenticated so server-fns can also call it directly if needed.
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated, service_role;
