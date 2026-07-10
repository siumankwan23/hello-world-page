import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, UserPlus, KeyRound, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Northstar Realty" },
      { name: "description", content: "Sign in or create an agent account for Northstar Realty." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const submit = async () => {
    setError("");
    if (!email.trim()) return setError("Please enter your email address.");
    if (mode === "signup" && !fullName.trim()) return setError("Please enter your full name.");
    if (!password.trim()) return setError("Please enter a password.");

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim(), role: "agent" },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setError("Account created. Please check your email to confirm, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.18),_transparent_45%),linear-gradient(135deg,_#f8fbff_0%,_#eef4ff_100%)]">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Northstar Realty</p>
            <p className="text-sm text-slate-500">Agent portal</p>
          </div>
        </Link>

        <Card className="border-0 shadow-lg shadow-slate-200/70">
          <CardHeader>
            <CardTitle>{mode === "signup" ? "Create your agent account" : "Welcome back"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={mode === "signup" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setMode("signup")}
              >
                <UserPlus className="h-4 w-4" /> Sign up
              </Button>
              <Button
                variant={mode === "signin" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setMode("signin")}
              >
                <KeyRound className="h-4 w-4" /> Sign in
              </Button>
            </div>

            {mode === "signup" && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-700">Full name</p>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alex Morgan" />
              </div>
            )}
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Email</p>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@example.com" />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Password</p>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Create a secure password" : "Enter your password"}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button className="w-full gap-2" onClick={submit} disabled={loading}>
              {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-xs text-slate-500">
              Are you a client? You'll receive an invitation email from your agent with a link to activate your account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
