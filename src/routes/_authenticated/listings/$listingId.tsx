import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  listListings,
  getListingDetail,
  updateListing,
  deleteListing,
  listListingNotes,
  createNote,
  updateNote,
  deleteNote,
} from "@/lib/listings.functions";
import { supabase } from "@/integrations/supabase/client";
import { ListingDetailPanel } from "@/components/listings-view";
import { ListingFormDialog } from "@/components/listing-form-dialog";
import { NotesPanel } from "@/components/notes-panel";

export const Route = createFileRoute("/_authenticated/listings/$listingId")({
  head: () => ({
    meta: [
      { title: "Listing Details — Northstar Realty" },
      { name: "description", content: "View listing details and notes." },
    ],
  }),
  component: ListingDetailPage,
});

function ListingDetailPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { listingId } = Route.useParams();

  const listFn = useServerFn(listListings);
  const updateFn = useServerFn(updateListing);
  const deleteFn = useServerFn(deleteListing);
  const listNotesFn = useServerFn(listListingNotes);
  const createNoteFn = useServerFn(createNote);
  const updateNoteFn = useServerFn(updateNote);
  const deleteNoteFn = useServerFn(deleteNote);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<"agent" | "client">("client");
  const [currentUserId, setCurrentUserId] = useState("");

  // Get current user info
  const userQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
        // Get user role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (roleData) setUserRole(roleData.role as "agent" | "client");
      }
      return data.user;
    },
  });

  // Get all listings to find the current one
  const listingsQuery = useQuery({
    queryKey: ["listings"],
    queryFn: () => listFn() as Promise<any[]>,
  });

  // Get notes for this listing
  const notesQuery = useQuery({
    queryKey: ["notes", listingId],
    queryFn: async () => {
      const allNotes = (await listNotesFn()) as any[];
      return allNotes.filter((n) => n.listing_id === listingId);
    },
  });

  const updateMut = useMutation({
    mutationFn: (data: any) => updateFn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      setDialogOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      navigate({ to: "/dashboard" });
    },
  });

  const createNoteMut = useMutation({
    mutationFn: (comment: string) =>
      createNoteFn({ data: { listing_id: listingId, comment } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", listingId] });
    },
  });

  const updateNoteMut = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      updateNoteFn({ data: { id, comment } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", listingId] });
    },
  });

  const deleteNoteMut = useMutation({
    mutationFn: (id: string) => deleteNoteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", listingId] });
    },
  });

  const listing = listingsQuery.data?.find((l) => l.id === listingId);

  if (listingsQuery.isLoading || userQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-center">
          <p className="text-slate-600">Listing not found</p>
          <Button
            className="mt-4"
            onClick={() => navigate({ to: "/dashboard" })}
          >
            Back to Dashboard
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate({ to: "/dashboard" })}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{listing.address}</h1>
            <p className="text-slate-500">
              {listing.city}, {listing.state} {listing.zip_code}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <ListingDetailPanel
            listing={listing}
            onClose={() => navigate({ to: "/dashboard" })}
            onEdit={() => setDialogOpen(true)}
            onDelete={() => {
              if (confirm(`Delete ${listing.address}?`)) {
                deleteMut.mutate(listing.id);
              }
            }}
          />
        </div>

        {/* Sidebar - Notes */}
        <div>
          <Card className="sticky top-4 p-4">
            <NotesPanel
              notes={notesQuery.data || []}
              currentUserId={currentUserId}
              userRole={userRole}
              onAddNote={async (comment) => {
                await createNoteMut.mutateAsync(comment);
              }}
              onUpdateNote={async (id, comment) => {
                await updateNoteMut.mutateAsync({ id, comment });
              }}
              onDeleteNote={async (id) => {
                await deleteNoteMut.mutateAsync(id);
              }}
              isLoading={notesQuery.isLoading}
            />
          </Card>
        </div>
      </div>

      {/* Form Dialog */}
      <ListingFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        searchId={listing.search_id}
        editing={listing}
        onSubmit={async (data) => {
          await updateMut.mutateAsync(data);
        }}
        isSubmitting={updateMut.isPending}
        error={
          (updateMut.error as Error | null)?.message || null
        }
      />
    </main>
  );
}
