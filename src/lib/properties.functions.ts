import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const propertyTypes = [
  "Single Family",
  "Multi Family",
  "Condo",
  "Townhouse",
  "Land",
  "Commercial",
  "Other",
] as const;

const listingStatuses = [
  "Active",
  "Under Contract",
  "Sold",
] as const;

const clientStatuses = [
  "Interested",
  "Tour Scheduled",
  "Toured",
  "Offer Submitted",
  "CounterOffer",
  "CounterOffer Submitted",
  "Offer Accepted",
  "Not Interested",
] as const;

const requiredUrl = z
  .string()
  .trim()
  .min(1, "Listing URL is required")
  .max(2048)
  .url("Must be a valid URL");

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .url("Must be a valid URL")
  .optional()
  .or(z.literal(""));

const baseFields = {
  photo_url: optionalUrl,
  url: requiredUrl,
  address: z.string().trim().min(1, "Address is required").max(255),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State is required").max(50),
  zip_code: z.string().trim().min(3, "ZIP is required").max(20),
  price: z.number().int().min(0),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().min(0),
  square_feet: z.number().int().min(0),
  lot_size: z.number().min(0).nullable().optional(),
  property_type: z.enum(propertyTypes),
  year_built: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 1)
    .nullable()
    .optional(),
  listing_status: z.enum(listingStatuses),
  client_status: z.enum(clientStatuses),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
};

const createSchema = z.object({ client_id: z.string().uuid(), ...baseFields });
const updateSchema = z.object({ id: z.string().uuid(), ...baseFields });

async function resolveClientAccess(
  ctx: { supabase: any; userId: string },
  clientId: string,
): Promise<{ agent_id: string }> {
  const { data: client, error } = await ctx.supabase
    .from("clients")
    .select("id, agent_id, client_user_id")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!client) throw new Error("Client not found.");
  if (client.agent_id !== ctx.userId && client.client_user_id !== ctx.userId) {
    throw new Error("Forbidden");
  }
  return { agent_id: client.agent_id };
}

export const listProperties = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ client_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await resolveClientAccess(context, data.client_id);
    const { data: rows, error } = await context.supabase
      .from("properties")
      .select("*")
      .eq("client_id", data.client_id)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { agent_id } = await resolveClientAccess(context, data.client_id);
    const { data: inserted, error } = await context.supabase
      .from("properties")
      .insert({
        client_id: data.client_id,
        agent_id,
        photo_url: data.photo_url || null,
        url: data.url || null,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        square_feet: data.square_feet,
        lot_size: data.lot_size ?? null,
        property_type: data.property_type,
        year_built: data.year_built ?? null,
        listing_status: data.listing_status,
        client_status: data.client_status,
        notes: data.notes || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });

export const updateProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing, error: exErr } = await context.supabase
      .from("properties")
      .select("id, client_id")
      .eq("id", data.id)
      .maybeSingle();
    if (exErr) throw new Error(exErr.message);
    if (!existing) throw new Error("Property not found.");
    await resolveClientAccess(context, existing.client_id);

    const { error } = await context.supabase
      .from("properties")
      .update({
        photo_url: data.photo_url || null,
        url: data.url || null,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        square_feet: data.square_feet,
        lot_size: data.lot_size ?? null,
        property_type: data.property_type,
        year_built: data.year_built ?? null,
        listing_status: data.listing_status,
        client_status: data.client_status,
        notes: data.notes || null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing, error: exErr } = await context.supabase
      .from("properties")
      .select("id, client_id")
      .eq("id", data.id)
      .maybeSingle();
    if (exErr) throw new Error(exErr.message);
    if (!existing) throw new Error("Property not found.");
    await resolveClientAccess(context, existing.client_id);

    const { error } = await context.supabase
      .from("properties")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
