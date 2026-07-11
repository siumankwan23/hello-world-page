import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listClients,
  createClient as createClientFn,
  updateClient as updateClientFn,
  deleteClient as deleteClientFn,
  getMyContext,
} from "@/lib/clients.functions";
import {
  listProperties,
  createProperty,
  updateProperty,
  deleteProperty,
} from "@/lib/properties.functions";
import {
  PropertyFormDialog,
  type PropertyFormValues,
} from "@/components/property-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Home,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowLeft,
  Mail,
  Phone,
  UserCircle2,
  MapPin,
  ExternalLink,
  ImageIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Northstar Realty" },
      { name: "description", content: "Manage your clients and properties." },
    ],
  }),
  component: DashboardPage,
});

type ClientRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: "pending_invitation" | "active";
  invited_at: string;
  activated_at: string | null;
  updated_at: string;
  created_at: string;
};

type PropertyRow = {
  id: string;
  client_id: string;
  photo_url: string | null;
  url: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  lot_size: number | null;
  property_type: string;
  year_built: number | null;
  listing_status: string;
  client_status: string;
  notes: string | null;
  updated_at: string;
  created_at: string;
};

function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getCtx = useServerFn(getMyContext);

  const ctxQuery = useQuery({ queryKey: ["me-context"], queryFn: () => getCtx() });

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (ctxQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const ctx = ctxQuery.data;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.18),_transparent_45%),linear-gradient(135deg,_#f8fbff_0%,_#eef4ff_100%)] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold">Northstar Realty</p>
              <p className="text-sm text-slate-500">
                {ctx?.role === "agent"
                  ? "Agent dashboard"
                  : ctx?.role === "client"
                    ? "Client dashboard"
                    : "Dashboard"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {ctx?.profile?.full_name && (
              <span className="hidden text-sm text-slate-600 md:inline">
                {ctx.profile.full_name}
              </span>
            )}
            <Button variant="outline" className="gap-2" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      {ctx?.role === "agent" ? (
        <AgentView />
      ) : ctx?.role === "client" ? (
        <ClientView ctx={ctx} />
      ) : (
        <main className="mx-auto max-w-3xl px-6 py-16 text-center text-slate-600">
          Your account doesn't have a role assigned yet. Contact support.
        </main>
      )}
    </div>
  );
}

/* ------------------------ AGENT VIEW ------------------------ */

function AgentView() {
  const qc = useQueryClient();
  const list = useServerFn(listClients);
  const create = useServerFn(createClientFn);
  const update = useServerFn(updateClientFn);
  const remove = useServerFn(deleteClientFn);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);

  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: () => list() as Promise<ClientRow[]>,
  });

  const createMut = useMutation({
    mutationFn: (data: { full_name: string; email: string; phone: string }) =>
      create({
        data: { ...data, redirect_url: `${window.location.origin}/accept-invite` },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: string; full_name: string; email: string; phone: string }) =>
      update({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      setSelectedId(null);
    },
  });

  const clients = clientsQuery.data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.full_name, c.email, c.phone ?? ""].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [clients, query]);

  const selected = clients.find((c) => c.id === selectedId) ?? null;

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (c: ClientRow) => {
    setEditing(c);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: {
    full_name: string;
    email: string;
    phone: string;
  }) => {
    if (editing) await updateMut.mutateAsync({ id: editing.id, ...data });
    else await createMut.mutateAsync(data);
    setDialogOpen(false);
    setEditing(null);
  };

  if (selected) {
    return (
      <ClientDetail
        client={selected}
        onBack={() => setSelectedId(null)}
        onEdit={() => openEdit(selected)}
        onDelete={() => {
          if (confirm(`Delete ${selected.full_name}?`)) deleteMut.mutate(selected.id);
        }}
      />
    );
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:px-8">
      <Card className="border-0 shadow-lg shadow-slate-200/70">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Client dashboard</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Manage your clients and their properties.
            </p>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add client
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search clients"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="outline">{clients.length} total</Badge>
          </div>

          <Separator className="my-4" />

          {clientsQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading clients...</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-slate-600">
                No clients yet. Add your first client to get started.
              </p>
              <Button className="mt-4 gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add client
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-cyan-500 hover:shadow-md"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{c.full_name}</p>
                      <p className="text-sm text-slate-500">{c.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={c.status === "active" ? "default" : "secondary"}
                        className={
                          c.status === "pending_invitation"
                            ? "bg-amber-100 text-amber-800"
                            : ""
                        }
                      >
                        {c.status === "active" ? "Active" : "Pending invitation"}
                      </Badge>
                      {c.phone && <span className="text-sm text-slate-500">{c.phone}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        onSubmit={handleSubmit}
        submitting={createMut.isPending || updateMut.isPending}
        error={
          (createMut.error as Error | null)?.message ||
          (updateMut.error as Error | null)?.message ||
          null
        }
      />
    </main>
  );
}

function ClientDetail({
  client,
  onBack,
  onEdit,
  onDelete,
}: {
  client: ClientRow;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" className="gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back to clients
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" className="gap-2 text-red-600" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {client.full_name}
            <Badge
              variant={client.status === "active" ? "default" : "secondary"}
              className={
                client.status === "pending_invitation"
                  ? "bg-amber-100 text-amber-800"
                  : ""
              }
            >
              {client.status === "active" ? "Active" : "Pending invitation"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Mail className="h-4 w-4" /> Email
              </p>
              <p className="mt-1 font-medium">{client.email}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Phone className="h-4 w-4" /> Phone
              </p>
              <p className="mt-1 font-medium">{client.phone || "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Invited</p>
              <p className="mt-1 font-medium">
                {new Date(client.invited_at).toLocaleString()}
              </p>
            </div>
          </div>
          {client.status === "pending_invitation" && (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              An invitation email has been sent. This client will appear as Active
              once they set their password.
            </p>
          )}
        </CardContent>
      </Card>

      <PropertiesPanel clientId={client.id} />
    </main>
  );
}

/* ------------------------ CLIENT VIEW ------------------------ */

function ClientView({ ctx }: { ctx: any }) {
  const { clientRecord, agent, profile } = ctx;

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:px-8">
      <Card className="border-0 shadow-lg shadow-slate-200/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <UserCircle2 className="h-6 w-6" />
            Welcome, {profile?.full_name || clientRecord?.full_name || "there"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Your email</p>
              <p className="mt-1 font-medium">
                {profile?.email || clientRecord?.email}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Phone</p>
              <p className="mt-1 font-medium">
                {profile?.phone || clientRecord?.phone || "—"}
              </p>
            </div>
          </div>

          {agent && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Your agent</p>
              <p className="mt-1 text-slate-700">{agent.full_name || agent.email}</p>
              <p className="text-sm text-slate-500">{agent.email}</p>
              {agent.phone && (
                <p className="text-sm text-slate-500">{agent.phone}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {clientRecord?.id ? (
        <PropertiesPanel clientId={clientRecord.id} />
      ) : (
        <Card className="border-0 shadow-lg shadow-slate-200/70">
          <CardContent className="py-8 text-center text-slate-500">
            No client record linked to your account.
          </CardContent>
        </Card>
      )}
    </main>
  );
}

/* ------------------------ PROPERTIES ------------------------ */

function PropertiesPanel({ clientId }: { clientId: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listProperties);
  const createFn = useServerFn(createProperty);
  const updateFn = useServerFn(updateProperty);
  const deleteFn = useServerFn(deleteProperty);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyRow | null>(null);

  const query = useQuery({
    queryKey: ["properties", clientId],
    queryFn: () =>
      listFn({ data: { client_id: clientId } }) as Promise<PropertyRow[]>,
  });

  const createMut = useMutation({
    mutationFn: (values: PropertyFormValues) =>
      createFn({ data: { client_id: clientId, ...values } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties", clientId] });
      setOpen(false);
      setEditing(null);
    },
  });

  const updateMut = useMutation({
    mutationFn: (payload: { id: string; values: PropertyFormValues }) =>
      updateFn({ data: { id: payload.id, ...payload.values } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties", clientId] });
      setOpen(false);
      setEditing(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["properties", clientId] }),
  });

  const properties = query.data ?? [];

  return (
    <Card className="border-0 shadow-lg shadow-slate-200/70">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Properties</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Manually added properties for this client.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{properties.length} total</Badge>
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add property
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <p className="text-sm text-slate-500">Loading properties…</p>
        ) : properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-slate-600">
              No properties yet. Add the first one to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onEdit={() => {
                  setEditing(p);
                  setOpen(true);
                }}
                onDelete={() => {
                  if (confirm(`Delete ${p.address}?`)) deleteMut.mutate(p.id);
                }}
              />
            ))}
          </div>
        )}
      </CardContent>

      <PropertyFormDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        onSubmit={async (values) => {
          if (editing) await updateMut.mutateAsync({ id: editing.id, values });
          else await createMut.mutateAsync(values);
        }}
        submitting={createMut.isPending || updateMut.isPending}
        error={
          (createMut.error as Error | null)?.message ||
          (updateMut.error as Error | null)?.message ||
          null
        }
      />
    </Card>
  );
}

function PropertyCard({
  property,
  onEdit,
  onDelete,
}: {
  property: PropertyRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(property.price || 0);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-video w-full bg-slate-100">
        {property.photo_url ? (
          <img
            src={property.photo_url}
            alt={property.address}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-900">{property.address}</p>
            <p className="flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {property.city}, {property.state} {property.zip_code}
            </p>
          </div>
          <p className="text-lg font-bold text-slate-900">{price}</p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <span>{property.bedrooms} bd</span>
          <span>{property.bathrooms} ba</span>
          <span>{property.square_feet.toLocaleString()} sqft</span>
          {property.lot_size != null && <span>{property.lot_size} lot</span>}
          {property.year_built != null && <span>Built {property.year_built}</span>}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{property.property_type}</Badge>
          <Badge variant="outline">{property.listing_status}</Badge>
          <Badge className="bg-cyan-100 text-cyan-800">{property.client_status}</Badge>
        </div>

        {property.notes && (
          <p className="line-clamp-3 text-sm text-slate-600">{property.notes}</p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Last updated {new Date(property.updated_at).toLocaleString()}</span>
          <div className="flex items-center gap-1">
            {property.url && (
              <a
                href={property.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                title="Open listing"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------ CLIENT FORM ------------------------ */

function ClientFormDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  submitting,
  error,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: ClientRow | null;
  onSubmit: (d: { full_name: string; email: string; phone: string }) => void | Promise<void>;
  submitting: boolean;
  error: string | null;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (open) {
      setFullName(editing?.full_name ?? "");
      setEmail(editing?.email ?? "");
      setPhone(editing?.phone ?? "");
      setLocalError("");
    }
  }, [open, editing]);

  const submit = () => {
    setLocalError("");
    const name = fullName.trim();
    const em = email.trim();
    if (!name) return setLocalError("Full name is required.");
    if (!em) return setLocalError("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))
      return setLocalError("Please enter a valid email address.");
    onSubmit({ full_name: name, email: em, phone: phone.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit client" : "Add a new client"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Full name *</p>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Email address *</p>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Phone number</p>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
          {(localError || error) && (
            <p className="text-sm text-red-600">{localError || error}</p>
          )}
          {!editing && (
            <p className="text-xs text-slate-500">
              An invitation email will be sent so this client can set their password.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Saving..." : editing ? "Save changes" : "Send invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
