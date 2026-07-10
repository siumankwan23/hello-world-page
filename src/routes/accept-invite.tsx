import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { activateInvitedClient } from "@/lib/clients.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, CheckCircle2 } from "lucide-react";

const searchSchema = z.object({
  // Supabase puts tokens in the hash by default; keep this permissive
  token_hash: z.string().optional(),
  type: z.string().optional(),
});

export const Route = createFileRoute("/accept-invite")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Accept invitation — Northstar Realty" },
      { name: "description", content: "Set your password to activate your Northstar Realty client account." },
    ],
  }),
  component: AcceptInvite,
});

function AcceptInvite() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/accept-invite" });
  const [status, setStatus] = useState<"loading" | "ready" | "no-session" | "done" | "error">("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const activate = useServerFn(activateInvitedClient);

  useEffect(() => {
    let cancelled = false;

    const readSession = async () => {
      // Give Supabase a tick to process the URL hash after landing here
      await new Promise((r) => setTimeout(r, 250));
      // If a token_hash query param is present (some flows), try verifying it
      if (search.token_hash && search.type) {
        try {
          await supabase.auth.verifyOtp({
            token_hash: search.token_hash,
            type: search.type as any,
          });
        } catch {
          /* fall through to session read */
        }
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session?.user) {
        setEmail(data.session.user.email ?? null);
        setStatus("ready");
      } else {
        setStatus("no-session");
      }
    };

    readSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user && !cancelled) {
        setEmail(session.user.email ?? null);
        setStatus("ready");
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [search.token_hash, search.type]);

  const submit = async () => {
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) throw updErr;
      await activate({});
      setStatus("done");
      setTimeout(() => navigate({ to: "/dashboard", replace: true }), 800);
    } catch (e: any) {
      setError(e?.message ?? "Could not activate your account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.18),_transparent_45%),linear-gradient(135deg,_#f8fbff_0%,_#eef4ff_100%)]">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Northstar Realty</p>
            <p className="text-sm text-slate-500">Activate your client account</p>
          </div>
        </div>

        <Card className="border-0 shadow-lg shadow-slate-200/70">
          <CardHeader>
            <CardTitle>
              {status === "done" ? "You're all set!" : "Create your password"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "loading" && <p className="text-sm text-slate-600">Verifying your invitation...</p>}

            {status === "no-session" && (
              <div className="space-y-3 text-sm text-slate-600">
                <p>
                  This invitation link is invalid or has expired. Please ask your agent to send a new
                  invitation.
                </p>
                <Button variant="outline" onClick={() => navigate({ to: "/auth" })}>
                  Go to sign in
                </Button>
              </div>
            )}

            {status === "ready" && (
              <>
                {email && (
                  <p className="text-sm text-slate-600">
                    Setting up account for <span className="font-medium">{email}</span>
                  </p>
                )}
                <div>
                  <p className="mb-1 text-sm font-medium text-slate-700">New password</p>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-slate-700">Confirm password</p>
                  <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button className="w-full" onClick={submit} disabled={submitting}>
                  {submitting ? "Activating..." : "Activate account"}
                </Button>
              </>
            )}

            {status === "done" && (
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <p>Account activated. Redirecting to your dashboard...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
