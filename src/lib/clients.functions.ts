import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const emailSchema = z.string().trim().email().max(255).transform((v) => v.toLowerCase());
const nameSchema = z.string().trim().min(1, "Full name is required").max(120);
const phoneSchema = z.string().trim().max(40).optional().or(z.literal(""));

const createSchema = z.object({
  full_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  redirect_url: z.string().url(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  full_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
});

async function requireAgent(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "agent")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: only agents can perform this action");
}

export const listClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAgent(context);
    const { data, error } = await context.supabase
      .from("clients")
      .select("id, full_name, email, phone, status, invited_at, activated_at, updated_at, created_at")
      .eq("agent_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireAgent(context);

    // Check duplicate in clients table (case-insensitive)
    const { data: existing, error: existErr } = await context.supabase
      .from("clients")
      .select("id")
      .ilike("email", data.email)
      .maybeSingle();
    if (existErr) throw new Error(existErr.message);
    if (existing) throw new Error("A user with this email address already exists.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check auth.users for existing email
    const { data: existingAuth } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 } as any);
    // listUsers doesn't filter by email in older SDKs; do a direct getUserByEmail if available
    try {
      // @ts-expect-error getUserByEmail exists in some SDK versions
      const byEmail = await supabaseAdmin.auth.admin.getUserByEmail?.(data.email);
      if (byEmail?.data?.user) {
        throw new Error("A user with this email address already exists.");
      }
    } catch (e: any) {
      if (e?.message?.includes("already exists")) throw e;
      // ignore SDK-shape errors; invite call below will also enforce uniqueness
    }
    void existingAuth;

    // Insert client row first so we have an id for metadata
    const { data: inserted, error: insertErr } = await context.supabase
      .from("clients")
      .insert({
        agent_id: context.userId,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        status: "pending_invitation",
      })
      .select()
      .single();
    if (insertErr) {
      if (insertErr.code === "23505") {
        throw new Error("A user with this email address already exists.");
      }
      throw new Error(insertErr.message);
    }

    // Send invitation email
    const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      {
        redirectTo: data.redirect_url,
        data: {
          role: "client",
          full_name: data.full_name,
          phone: data.phone || null,
          client_id: inserted.id,
          agent_id: context.userId,
        },
      },
    );

    if (inviteErr) {
      // Roll back client row on failure
      await context.supabase.from("clients").delete().eq("id", inserted.id);
      if (/already been registered|already registered|exists/i.test(inviteErr.message)) {
        throw new Error("A user with this email address already exists.");
      }
      throw new Error(inviteErr.message);
    }

    if (invited?.user) {
      await context.supabase
        .from("clients")
        .update({ client_user_id: invited.user.id })
        .eq("id", inserted.id);
    }

    return { id: inserted.id };
  });

export const updateClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireAgent(context);

    const { data: current, error: curErr } = await context.supabase
      .from("clients")
      .select("id, agent_id, email, client_user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (curErr) throw new Error(curErr.message);
    if (!current || current.agent_id !== context.userId) {
      throw new Error("Client not found.");
    }

    const emailChanged = current.email.toLowerCase() !== data.email;

    if (emailChanged) {
      const { data: dup } = await context.supabase
        .from("clients")
        .select("id")
        .ilike("email", data.email)
        .neq("id", data.id)
        .maybeSingle();
      if (dup) throw new Error("A user with this email address already exists.");

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      try {
        // @ts-expect-error may exist
        const byEmail = await supabaseAdmin.auth.admin.getUserByEmail?.(data.email);
        if (byEmail?.data?.user && byEmail.data.user.id !== current.client_user_id) {
          throw new Error("A user with this email address already exists.");
        }
      } catch (e: any) {
        if (e?.message?.includes("already exists")) throw e;
      }

      if (current.client_user_id) {
        await supabaseAdmin.auth.admin.updateUserById(current.client_user_id, {
          email: data.email,
        });
      }
    }

    const { error: updErr } = await context.supabase
      .from("clients")
      .update({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
      })
      .eq("id", data.id);
    if (updErr) {
      if (updErr.code === "23505") {
        throw new Error("A user with this email address already exists.");
      }
      throw new Error(updErr.message);
    }

    // Keep client's own profile in sync when activated
    if (current.client_user_id) {
      await context.supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || null,
        })
        .eq("id", current.client_user_id);
    }

    return { ok: true };
  });

export const deleteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAgent(context);
    const { error } = await context.supabase
      .from("clients")
      .delete()
      .eq("id", data.id)
      .eq("agent_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Called by an invited client immediately after they set a password.
 *  Uses their session to identify who they are, and finalizes the linked client row. */
export const activateInvitedClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Locate the client row linked to this auth user
    const { data: linked, error: linkErr } = await context.supabase
      .from("clients")
      .select("id, status, agent_id")
      .eq("client_user_id", context.userId)
      .maybeSingle();

    if (linkErr) throw new Error(linkErr.message);

    let clientRow = linked;

    if (!clientRow) {
      // Fallback: match by email (case-insensitive) among pending invites
      const email = (context.claims as any)?.email as string | undefined;
      if (!email) throw new Error("No invitation found for this account.");
      const { data: byEmail } = await context.supabase
        .from("clients")
        .select("id, status, agent_id")
        .ilike("email", email)
        .maybeSingle();
      if (!byEmail) throw new Error("No invitation found for this account.");
      clientRow = byEmail;
      await context.supabase
        .from("clients")
        .update({ client_user_id: context.userId })
        .eq("id", byEmail.id);
    }

    if (clientRow.status !== "active") {
      await context.supabase
        .from("clients")
        .update({ status: "active", activated_at: new Date().toISOString() })
        .eq("id", clientRow.id);
    }

    return { ok: true, client_id: clientRow.id, agent_id: clientRow.agent_id };
  });

/** Returns the current user's role plus, if a client, the linked client row + agent profile. */
export const getMyContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    const roleList = (roles ?? []).map((r: any) => r.role as "agent" | "client");
    const role: "agent" | "client" | null = roleList.includes("agent")
      ? "agent"
      : roleList.includes("client")
        ? "client"
        : null;

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id, full_name, email, phone, license_number, broker_name, broker_license_number")
      .eq("id", context.userId)
      .maybeSingle();

    let clientRecord: any = null;
    let agent: any = null;
    if (role === "client") {
      const { data: c } = await context.supabase
        .from("clients")
        .select("id, agent_id, full_name, email, phone, status")
        .eq("client_user_id", context.userId)
        .maybeSingle();
      clientRecord = c;
      if (c) {
        const { data: agentProfile } = await context.supabase
          .from("profiles")
          .select("id, full_name, email, phone, license_number, broker_name, broker_license_number")
          .eq("id", c.agent_id)
          .maybeSingle();
        agent = agentProfile;
      }
    }

    return { role, profile, clientRecord, agent };
  });
