import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { getMyContext } from "@/lib/clients.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Northstar Realty" },
      { name: "description", content: "Manage your profile information." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getProfile = useServerFn(getMyProfile);
  const update = useServerFn(updateMyProfile);
  const getCtx = useServerFn(getMyContext);

  const ctxQuery = useQuery({ queryKey: ["me-context"], queryFn: () => getCtx() });
  const profileQuery = useQuery({ queryKey: ["my-profile"], queryFn: () => getProfile() });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [brokerLicenseNumber, setBrokerLicenseNumber] = useState("");

  useEffect(() => {
    if (profileQuery.data) {
      setFullName(profileQuery.data.full_name ?? "");
      setPhone(profileQuery.data.phone ?? "");
      setLicenseNumber(profileQuery.data.license_number ?? "");
      setBrokerName(profileQuery.data.broker_name ?? "");
      setBrokerLicenseNumber(profileQuery.data.broker_license_number ?? "");
    }
  }, [profileQuery.data]);

  const isAgent = ctxQuery.data?.role === "agent";

  const mut = useMutation({
    mutationFn: (data: {
      full_name: string;
      phone: string;
      license_number: string;
      broker_name: string;
      broker_license_number: string;
    }) => update({ data }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["me-context"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update profile"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mut.mutate({
      full_name: fullName,
      phone,
      license_number: isAgent ? licenseNumber : "",
      broker_name: isAgent ? brokerName : "",
      broker_license_number: isAgent ? brokerLicenseNumber : "",
    });
  };

  if (profileQuery.isLoading || ctxQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.18),_transparent_45%),linear-gradient(135deg,_#f8fbff_0%,_#eef4ff_100%)] py-10">
      <main className="mx-auto max-w-2xl px-6">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to dashboard
            </Link>
          </Button>
        </div>

        <Card className="border-0 shadow-lg shadow-slate-200/70">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profileQuery.data?.email ?? ""} disabled />
                <p className="mt-1 text-xs text-slate-500">
                  Email is managed by your sign-in and can't be changed here.
                </p>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              {isAgent && (
                <>
                  <div>
                    <Label htmlFor="license">License number</Label>
                    <Input
                      id="license"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. RE-123456"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Shown to your clients on their dashboard.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="brokerName">Broker name</Label>
                    <Input
                      id="brokerName"
                      value={brokerName}
                      onChange={(e) => setBrokerName(e.target.value)}
                      placeholder="e.g. Northstar Realty Group"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Shown to your clients on their dashboard.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="brokerLicense">Broker license number</Label>
                    <Input
                      id="brokerLicense"
                      value={brokerLicenseNumber}
                      onChange={(e) => setBrokerLicenseNumber(e.target.value)}
                      placeholder="e.g. BR-789012"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Shown to your clients on their dashboard.
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/dashboard" })}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mut.isPending}>
                  {mut.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
