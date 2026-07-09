import { useMemo, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Search, Home, Users, ListChecks, Sparkles, ShieldCheck, ArrowRight, LogOut, UserPlus, KeyRound, ArrowLeft, Plus, MapPin, Pencil, Trash2, X, ExternalLink } from "lucide-react";

type Property = {
  id: string;
  address: string;
  url: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  note: string;
  addedBy: "client" | "agent";
  addedAt: string;
  updatedAt: string;
};


type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
  updated: string;
};

const clients: Client[] = [
  {
    id: 1,
    name: "Maya Chen",
    email: "maya@example.com",
    phone: "(714) 555-0148",
    updated: "2h ago",
  },
  {
    id: 2,
    name: "Jordan Alvarez",
    email: "jordan@example.com",
    phone: "(562) 555-0192",
    updated: "Today",
  },
  {
    id: 3,
    name: "Priya Singh",
    email: "priya@example.com",
    phone: "(949) 555-0104",
    updated: "Yesterday",
  },
];

const searches = [
  { title: "Orange County Homes under $900K", status: "Active", updated: "Today" },
  { title: "Chino Hills Pool Homes", status: "Watching", updated: "Yesterday" },
  { title: "Anaheim Investment Properties", status: "New", updated: "2 days ago" },
];

const listings = [
  {
    address: "2418 Harbor Ave",
    city: "Costa Mesa",
    price: "$875,000",
    status: "Active",
    clientStatus: "Schedule Showing",
  },
  {
    address: "833 Maple Street",
    city: "Chino Hills",
    price: "$1,240,000",
    status: "Pending",
    clientStatus: "Favorite",
  },
  {
    address: "66 W. Ball Road",
    city: "Anaheim",
    price: "$690,000",
    status: "New",
    clientStatus: "Interested",
  },
];

export function RealEstateApp() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"landing" | "dashboard">("landing");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [propertiesByClient, setPropertiesByClient] = useState<Record<number, Property[]>>({});
  const emptyForm = {
    address: "",
    url: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    note: "",
    addedBy: "agent" as "agent" | "client",
  };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [propertyError, setPropertyError] = useState("");

  const updateField = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setPropertyError("");
  };

  const handleSubmitProperty = () => {
    if (selectedClientId == null) return;
    if (!form.address.trim()) {
      setPropertyError("Please enter a property address.");
      return;
    }
    if (!form.note.trim()) {
      setPropertyError("Please add a note for this property.");
      return;
    }
    const now = new Date().toLocaleString();
    setPropertiesByClient((prev) => {
      const list = prev[selectedClientId] ?? [];
      if (editingId) {
        return {
          ...prev,
          [selectedClientId]: list.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  address: form.address.trim(),
                  url: form.url.trim(),
                  price: form.price.trim(),
                  bedrooms: form.bedrooms.trim(),
                  bathrooms: form.bathrooms.trim(),
                  squareFeet: form.squareFeet.trim(),
                  note: form.note.trim(),
                  addedBy: form.addedBy,
                  updatedAt: now,
                }
              : p,
          ),
        };
      }
      const property: Property = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        address: form.address.trim(),
        url: form.url.trim(),
        price: form.price.trim(),
        bedrooms: form.bedrooms.trim(),
        bathrooms: form.bathrooms.trim(),
        squareFeet: form.squareFeet.trim(),
        note: form.note.trim(),
        addedBy: form.addedBy,
        addedAt: now,
        updatedAt: now,
      };
      return { ...prev, [selectedClientId]: [property, ...list] };
    });
    resetForm();
  };

  const handleEditProperty = (property: Property) => {
    setEditingId(property.id);
    setForm({
      address: property.address,
      url: property.url,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFeet: property.squareFeet,
      note: property.note,
      addedBy: property.addedBy,
    });
    setPropertyError("");
  };

  const handleDeleteProperty = (id: string) => {
    if (selectedClientId == null) return;
    setPropertiesByClient((prev) => ({
      ...prev,
      [selectedClientId]: (prev[selectedClientId] ?? []).filter((p) => p.id !== id),
    }));
    if (editingId === id) resetForm();
  };


  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) =>
      [client.name, client.email, client.phone].some((value) => value.toLowerCase().includes(q))
    );
  }, [query]);

  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? null;

  const handleContinue = () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!password.trim()) {
      setError(mode === "signup" ? "Please create a password." : "Please enter your password.");
      return;
    }

    setError("");
    setView("dashboard");
  };

  const handleSignOut = () => {
    setView("landing");
    setSelectedClientId(null);
    setEmail("");
    setPassword("");
    setName("");
    setError("");
  };

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
              <p className="text-sm text-slate-500">Agent account access</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Supabase-ready
            </Badge>
            {view === "dashboard" ? (
              <Button variant="outline" className="gap-2" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            ) : (
              <Button>Agent portal</Button>
            )}
          </div>
        </div>
      </header>

      {view === "landing" ? (
        <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:px-8">
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-0 shadow-lg shadow-slate-200/70">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 text-sm font-medium text-cyan-700">
                  <Sparkles className="h-4 w-4" /> Agent account creation and sign in
                </div>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                  Create your agent account or sign in to reach your client dashboard.
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-slate-600">
                  This top-level landing experience is designed for individual agents to create an
                  account, log in, and instantly enter the client management workspace.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Button
                    variant={mode === "signup" ? "default" : "outline"}
                    className="gap-2"
                    onClick={() => setMode("signup")}
                  >
                    <UserPlus className="h-4 w-4" /> Create account
                  </Button>
                  <Button
                    variant={mode === "signin" ? "default" : "outline"}
                    className="gap-2"
                    onClick={() => setMode("signin")}
                  >
                    <KeyRound className="h-4 w-4" /> Sign in
                  </Button>
                </div>

                <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {mode === "signup" ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Full name</p>
                        <Input
                          placeholder="Alex Morgan"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                        />
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-sm font-medium text-slate-700">Email address</p>
                    <Input
                      type="email"
                      placeholder="agent@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Password</p>
                    <Input
                      type="password"
                      placeholder={mode === "signup" ? "Create a secure password" : "Enter your password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  {error ? <p className="text-sm text-red-600">{error}</p> : null}
                  <Button className="w-full gap-2" onClick={handleContinue}>
                    {mode === "signup" ? "Create account" : "Sign in"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-slate-200/70">
              <CardHeader>
                <CardTitle>What agents get</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Personal workspace</p>
                  <p className="mt-1">Every agent gets a dedicated dashboard for their own clients and listings.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Secure sign in</p>
                  <p className="mt-1">Email-first account access keeps onboarding simple while staying protected.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Client tracking</p>
                  <p className="mt-1">Track searches, listings, notes, and follow-ups from one calm workspace.</p>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      ) : selectedClient ? (
        <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" className="gap-2" onClick={() => setSelectedClientId(null)}>
              <ArrowLeft className="h-4 w-4" /> Back to clients
            </Button>
            <Badge variant="secondary">Client dashboard</Badge>
          </div>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-0 shadow-lg shadow-slate-200/70">
              <CardHeader>
                <CardTitle>{selectedClient.name}</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Primary buyer • Updated {selectedClient.updated}</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium">{selectedClient.email}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="font-medium">{selectedClient.phone}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Active items</p>
                    <p className="font-medium">{(propertiesByClient[selectedClient.id] ?? []).length} properties</p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Current needs</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      <li>• Wants a home under $900K in Orange County</li>
                      <li>• Needs close access to schools and commute routes</li>
                      <li>• Interested in a move-in-ready property</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Follow-up notes</p>
                    <p className="mt-3 text-sm text-slate-600">
                      Client is reviewing two listings and asked for a weekend tour schedule.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-0 shadow-lg shadow-slate-200/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5" /> Client activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-medium">Listing review</p>
                    <p className="text-sm text-slate-500">Viewed 3 homes this week</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-medium">Next touchpoint</p>
                    <p className="text-sm text-slate-500">Call scheduled for tomorrow afternoon</p>
                  </div>
                </CardContent>
              </Card>

          </div>
          </section>

          <Card className="border-0 shadow-lg shadow-slate-200/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Properties
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Both the client and agent can add properties to track. Each property includes a note and can be edited or deleted.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">
                    {editingId ? "Edit property" : "Add a property"}
                  </p>
                  {editingId ? (
                    <Button variant="ghost" size="sm" className="gap-1" onClick={resetForm}>
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Property address</p>
                    <Input
                      placeholder="123 Ocean Blvd, Newport Beach"
                      value={form.address}
                      onChange={(event) => updateField("address", event.target.value)}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Listing URL</p>
                    <Input
                      placeholder="https://..."
                      value={form.url}
                      onChange={(event) => updateField("url", event.target.value)}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Price</p>
                    <Input
                      placeholder="$850,000"
                      value={form.price}
                      onChange={(event) => updateField("price", event.target.value)}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Square feet</p>
                    <Input
                      placeholder="1,850"
                      value={form.squareFeet}
                      onChange={(event) => updateField("squareFeet", event.target.value)}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Bedrooms</p>
                    <Input
                      placeholder="3"
                      value={form.bedrooms}
                      onChange={(event) => updateField("bedrooms", event.target.value)}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Bathrooms</p>
                    <Input
                      placeholder="2"
                      value={form.bathrooms}
                      onChange={(event) => updateField("bathrooms", event.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-700">Added by</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={form.addedBy === "agent" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => updateField("addedBy", "agent")}
                      >
                        Agent
                      </Button>
                      <Button
                        type="button"
                        variant={form.addedBy === "client" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => updateField("addedBy", "client")}
                      >
                        Client
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-slate-700">Note</p>
                  <textarea
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    rows={3}
                    placeholder="Why this property? Anything to remember..."
                    value={form.note}
                    onChange={(event) => updateField("note", event.target.value)}
                  />
                </div>
                {propertyError ? <p className="mt-2 text-sm text-red-600">{propertyError}</p> : null}
                <Button className="mt-3 gap-2" onClick={handleSubmitProperty}>
                  <Plus className="h-4 w-4" /> {editingId ? "Save changes" : "Add property"}
                </Button>
              </div>

              <div className="space-y-3">
                {(propertiesByClient[selectedClient.id] ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No properties added yet.</p>
                ) : (
                  (propertiesByClient[selectedClient.id] ?? []).map((property) => (
                    <div key={property.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{property.address}</p>
                          {property.url ? (
                            <a
                              href={property.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-700 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> View listing
                            </a>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={property.addedBy === "agent" ? "default" : "secondary"}>
                            Added by {property.addedBy}
                          </Badge>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => handleEditProperty(property)}>
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-red-600" onClick={() => handleDeleteProperty(property.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-slate-400">Price</p>
                          <p className="font-medium">{property.price || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Beds</p>
                          <p className="font-medium">{property.bedrooms || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Baths</p>
                          <p className="font-medium">{property.bathrooms || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Sq ft</p>
                          <p className="font-medium">{property.squareFeet || "—"}</p>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{property.note}</p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                        <span>Added {property.addedAt}</span>
                        <span>Last updated {property.updatedAt}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>



        </main>
      ) : (
        <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:px-8">
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-0 shadow-lg shadow-slate-200/70">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Agent client dashboard</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Review your client roster and open a client dashboard from here.</p>
                </div>
                <Badge variant="outline">Live demo data</Badge>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search clients"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline">Filter</Button>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Assigned clients</p>
                    <p className="text-2xl font-semibold">{clients.length}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Active searches</p>
                    <p className="text-2xl font-semibold">18</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Client listings</p>
                    <p className="text-2xl font-semibold">41</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Updated today</p>
                    <p className="text-2xl font-semibold">9</p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-3">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedClientId(client.id)}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-cyan-500 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{client.name}</p>
                          <p className="text-sm text-slate-500">{client.email}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{client.searches} searches</Badge>
                          <Badge>{client.listings} listings</Badge>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
                        <span>{client.phone}</span>
                        <span>Updated {client.updated}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-0 shadow-lg shadow-slate-200/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5" /> Saved searches
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {searches.map((search) => (
                    <div key={search.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{search.title}</p>
                          <p className="text-sm text-slate-500">Updated {search.updated}</p>
                        </div>
                        <Badge variant="secondary">{search.status}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg shadow-slate-200/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Recent listings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {listings.map((listing) => (
                    <div key={listing.address} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{listing.address}</p>
                          <p className="text-sm text-slate-500">{listing.city}</p>
                        </div>
                        <Badge>{listing.status}</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                        <span>{listing.price}</span>
                        <span>{listing.clientStatus}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
