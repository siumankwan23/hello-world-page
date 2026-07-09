import { useMemo, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Search, Home, Users, ListChecks, Sparkles, Mail, ShieldCheck, ArrowRight } from "lucide-react";

const clients = [
  {
    id: 1,
    name: "Maya Chen",
    email: "maya@example.com",
    phone: "(714) 555-0148",
    searches: 3,
    listings: 5,
    updated: "2h ago",
  },
  {
    id: 2,
    name: "Jordan Alvarez",
    email: "jordan@example.com",
    phone: "(562) 555-0192",
    searches: 2,
    listings: 4,
    updated: "Today",
  },
  {
    id: 3,
    name: "Priya Singh",
    email: "priya@example.com",
    phone: "(949) 555-0104",
    searches: 4,
    listings: 7,
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

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) =>
      [client.name, client.email, client.phone].some((value) => value.toLowerCase().includes(q))
    );
  }, [query]);

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
              <p className="text-sm text-slate-500">Agent & client listing workspace</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Supabase-ready
            </Badge>
            <Button>+ Add Client</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-0 shadow-lg shadow-slate-200/70">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 text-sm font-medium text-cyan-700">
                <Sparkles className="h-4 w-4" /> Built for individual agents
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Sign up as an individual agent and manage your own clients, searches, and listings.
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-600">
                This experience is designed for solo agents who want a secure, polished workspace
                to organize clients, track searches, manage listings, and stay on top of follow-up
                activity from one place.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="gap-2">
                  Continue to dashboard <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" /> Email-first sign in
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg shadow-slate-200/70">
            <CardHeader>
              <CardTitle>Platform highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Personal agent workspace</p>
                <p className="mt-1">Each agent gets their own dashboard for managing clients, searches, and listings independently.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Supabase-ready</p>
                <p className="mt-1">Configured for auth, database, storage, realtime, and RLS for a secure personal workflow.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Client collaboration</p>
                <p className="mt-1">Agents can keep client conversations, notes, and activity history organized in one place.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-0 shadow-lg shadow-slate-200/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Agent client dashboard</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Each agent sees and manages their own assigned clients.</p>
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
                  <p className="text-2xl font-semibold">24</p>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Searches</TableHead>
                    <TableHead>Listings</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-slate-500">{client.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.searches}</TableCell>
                      <TableCell>{client.listings}</TableCell>
                      <TableCell>{client.updated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
    </div>
  );
}
