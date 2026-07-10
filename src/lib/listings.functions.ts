import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Zod schemas
const addressSchema = z.string().trim().min(1, "Address is required").max(255);
const citySchema = z.string().trim().min(1, "City is required").max(100);
const stateSchema = z.string().trim().min(2, "State is required").max(2);
const zipSchema = z.string().trim().min(5, "ZIP code is required").max(10);
const priceSchema = z.number().int().min(0, "Price must be positive");
const bedroomsSchema = z.number().int().min(0, "Bedrooms must be non-negative");
const bathroomsSchema = z.number().min(0, "Bathrooms must be non-negative");
const squareFeetSchema = z.number().int().min(0, "Square feet must be non-negative");
const lotSizeSchema = z.number().min(0, "Lot size must be non-negative").optional();
const mlsSchema = z.string().trim().max(50).optional().or(z.literal(""));
const yearBuiltSchema = z.number().int().min(1800).max(new Date().getFullYear() + 1).optional();
const propertyTypeSchema = z.enum([
  "Single Family",
  "Multi Family",
  "Condo",
  "Townhouse",
  "Land",
  "Commercial",
  "Other",
]);
const listingStatusSchema = z.enum(["New", "Active", "Pending", "Under Contract", "Sold", "Withdrawn", "Off Market"]);
const clientStatusSchema = z.enum([
  "Interested",
  "Favorite",
  "Schedule Showing",
  "Offer Submitted",
  "Offer Accepted",
  "Not Interested",
  "Watching",
  "Closed",
]);
const notesSchema = z.string().trim().max(2000).optional().or(z.literal(""));
const photosSchema = z.array(z.string().url()).optional().or(z.literal([]));

const createSearchSchema = z.object({
  client_id: z.string().uuid(),
  name: z.string().trim().min(1, "Search name is required").max(255),
});

const createListingSchema = z.object({
  search_id: z.string().uuid(),
  mls_number: mlsSchema,
  address: addressSchema,
  city: citySchema,
  state: stateSchema,
  zip_code: zipSchema,
  price: priceSchema,
  bedrooms: bedroomsSchema,
  bathrooms: bathroomsSchema,
  square_feet: squareFeetSchema,
  lot_size: lotSizeSchema,
  property_type: propertyTypeSchema,
  year_built: yearBuiltSchema,
  listing_status: listingStatusSchema,
  client_status: clientStatusSchema,
  notes: notesSchema,
  photos: photosSchema,
});

const updateListingSchema = z.object({
  id: z.string().uuid(),
  mls_number: mlsSchema,
  address: addressSchema,
  city: citySchema,
  state: stateSchema,
  zip_code: zipSchema,
  price: priceSchema,
  bedrooms: bedroomsSchema,
  bathrooms: bathroomsSchema,
  square_feet: squareFeetSchema,
  lot_size: lotSizeSchema,
  property_type: propertyTypeSchema,
  year_built: yearBuiltSchema,
  listing_status: listingStatusSchema,
  client_status: clientStatusSchema,
  notes: notesSchema,
  photos: photosSchema,
});

// Helper to verify access
async function requireAgentOrClient(
  ctx: { supabase: any; userId: string },
  clientId: string,
) {
  const { data: userRole, error: roleErr } = await ctx.supabase
    .from("user_roles")
    .select("role, client_id")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (roleErr) throw new Error(roleErr.message);
  if (!userRole) throw new Error("User role not found");

  if (userRole.role === "agent") {
    // Agent can access any client they manage
    const { data: client, error: clientErr } = await ctx.supabase
      .from("clients")
      .select("id, agent_id")
      .eq("id", clientId)
      .maybeSingle();
    if (clientErr) throw new Error(clientErr.message);
    if (!client || client.agent_id !== ctx.userId) {
      throw new Error("Forbidden: agent cannot access this client");
    }
  } else if (userRole.role === "client") {
    // Client can only access their own dashboard
    if (userRole.client_id !== clientId) {
      throw new Error("Forbidden: client can only access their own dashboard");
    }
  } else {
    throw new Error("Forbidden: invalid user role");
  }
}

// ================== SEARCHES ==================

export const listSearches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: userRole } = await context.supabase
      .from("user_roles")
      .select("role, client_id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!userRole) throw new Error("User role not found");

    let query = context.supabase.from("searches").select(
      `id, client_id, name, created_at, updated_at, 
       listings(count)`,
    );

    if (userRole.role === "client") {
      query = query.eq("client_id", userRole.client_id);
    } else if (userRole.role === "agent") {
      // Agent can see searches for their clients
      const { data: clients } = await context.supabase
        .from("clients")
        .select("id")
        .eq("agent_id", context.userId);
      if (!clients || clients.length === 0) return [];
      const clientIds = clients.map((c) => c.id);
      query = query.in("client_id", clientIds);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSearchSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireAgentOrClient(context, data.client_id);

    const { data: inserted, error } = await context.supabase
      .from("searches")
      .insert({
        client_id: data.client_id,
        name: data.name,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return inserted;
  });

export const updateSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z
        .object({
          id: z.string().uuid(),
          name: z.string().trim().min(1).max(255),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: search, error: searchErr } = await context.supabase
      .from("searches")
      .select("client_id")
      .eq("id", data.id)
      .maybeSingle();

    if (searchErr) throw new Error(searchErr.message);
    if (!search) throw new Error("Search not found");

    await requireAgentOrClient(context, search.client_id);

    const { error } = await context.supabase
      .from("searches")
      .update({ name: data.name })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: search, error: searchErr } = await context.supabase
      .from("searches")
      .select("client_id")
      .eq("id", data.id)
      .maybeSingle();

    if (searchErr) throw new Error(searchErr.message);
    if (!search) throw new Error("Search not found");

    await requireAgentOrClient(context, search.client_id);

    const { error } = await context.supabase
      .from("searches")
      .delete()
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ================== LISTINGS ==================

export const listListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: userRole } = await context.supabase
      .from("user_roles")
      .select("role, client_id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!userRole) throw new Error("User role not found");

    let query = context.supabase.from("listings").select("*");

    if (userRole.role === "client") {
      // Client can only see listings for their searches
      const { data: searches } = await context.supabase
        .from("searches")
        .select("id")
        .eq("client_id", userRole.client_id);
      if (!searches || searches.length === 0) return [];
      const searchIds = searches.map((s) => s.id);
      query = query.in("search_id", searchIds);
    } else if (userRole.role === "agent") {
      // Agent can see listings for their clients' searches
      const { data: clients } = await context.supabase
        .from("clients")
        .select("id")
        .eq("agent_id", context.userId);
      if (!clients || clients.length === 0) return [];
      const clientIds = clients.map((c) => c.id);

      const { data: searches } = await context.supabase
        .from("searches")
        .select("id")
        .in("client_id", clientIds);
      if (!searches || searches.length === 0) return [];
      const searchIds = searches.map((s) => s.id);
      query = query.in("search_id", searchIds);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getListingDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // This would be called with a listingId - for now returning handler
    // In actual implementation, pass listingId as a parameter
    const { data, error } = await context.supabase
      .from("listings")
      .select(
        `*,
         search:searches(client_id, name),
         notes:listing_notes(*)`,
      );
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createListingSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Verify search access
    const { data: search, error: searchErr } = await context.supabase
      .from("searches")
      .select("client_id")
      .eq("id", data.search_id)
      .maybeSingle();

    if (searchErr) throw new Error(searchErr.message);
    if (!search) throw new Error("Search not found");

    await requireAgentOrClient(context, search.client_id);

    const { data: inserted, error } = await context.supabase
      .from("listings")
      .insert({
        search_id: data.search_id,
        mls_number: data.mls_number || null,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        square_feet: data.square_feet,
        lot_size: data.lot_size || null,
        property_type: data.property_type,
        year_built: data.year_built || null,
        listing_status: data.listing_status,
        client_status: data.client_status,
        notes: data.notes || null,
        photos: data.photos && data.photos.length > 0 ? data.photos : [],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return inserted;
  });

export const updateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateListingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: listing, error: listingErr } = await context.supabase
      .from("listings")
      .select("search:searches(client_id)")
      .eq("id", data.id)
      .maybeSingle();

    if (listingErr) throw new Error(listingErr.message);
    if (!listing) throw new Error("Listing not found");

    await requireAgentOrClient(context, listing.search.client_id);

    const { error } = await context.supabase
      .from("listings")
      .update({
        mls_number: data.mls_number || null,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        square_feet: data.square_feet,
        lot_size: data.lot_size || null,
        property_type: data.property_type,
        year_built: data.year_built || null,
        listing_status: data.listing_status,
        client_status: data.client_status,
        notes: data.notes || null,
        photos: data.photos && data.photos.length > 0 ? data.photos : [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: listing, error: listingErr } = await context.supabase
      .from("listings")
      .select("search:searches(client_id)")
      .eq("id", data.id)
      .maybeSingle();

    if (listingErr) throw new Error(listingErr.message);
    if (!listing) throw new Error("Listing not found");

    await requireAgentOrClient(context, listing.search.client_id);

    const { error } = await context.supabase
      .from("listings")
      .delete()
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ================== NOTES ==================

export const listListingNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("listing_notes")
      .select(
        `*,
         user:profiles(id, full_name, email)`,
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z
        .object({
          listing_id: z.string().uuid(),
          comment: z.string().trim().min(1).max(2000),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: listing, error: listingErr } = await context.supabase
      .from("listings")
      .select("search:searches(client_id)")
      .eq("id", data.listing_id)
      .maybeSingle();

    if (listingErr) throw new Error(listingErr.message);
    if (!listing) throw new Error("Listing not found");

    await requireAgentOrClient(context, listing.search.client_id);

    const { data: inserted, error } = await context.supabase
      .from("listing_notes")
      .insert({
        listing_id: data.listing_id,
        user_id: context.userId,
        comment: data.comment,
      })
      .select(
        `*,
         user:profiles(id, full_name, email)`,
      )
      .single();

    if (error) throw new Error(error.message);
    return inserted;
  });

export const updateNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z
        .object({
          id: z.string().uuid(),
          comment: z.string().trim().min(1).max(2000),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: note, error: noteErr } = await context.supabase
      .from("listing_notes")
      .select("user_id, listing:listings(search:searches(client_id))")
      .eq("id", data.id)
      .maybeSingle();

    if (noteErr) throw new Error(noteErr.message);
    if (!note) throw new Error("Note not found");

    // Only the note creator can edit
    if (note.user_id !== context.userId) {
      throw new Error("Forbidden: cannot edit note created by another user");
    }

    await requireAgentOrClient(context, note.listing.search.client_id);

    const { error } = await context.supabase
      .from("listing_notes")
      .update({
        comment: data.comment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: note, error: noteErr } = await context.supabase
      .from("listing_notes")
      .select("user_id, listing:listings(search:searches(client_id))")
      .eq("id", data.id)
      .maybeSingle();

    if (noteErr) throw new Error(noteErr.message);
    if (!note) throw new Error("Note not found");

    // Only the note creator or agent can delete
    if (note.user_id !== context.userId) {
      const { data: userRole } = await context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .maybeSingle();
      if (userRole?.role !== "agent") {
        throw new Error("Forbidden: cannot delete note created by another user");
      }
    }

    await requireAgentOrClient(context, note.listing.search.client_id);

    const { error } = await context.supabase
      .from("listing_notes")
      .delete()
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
