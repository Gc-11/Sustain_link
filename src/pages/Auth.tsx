import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Leaf, Loader2 } from "lucide-react";
import type { AppRole } from "@/hooks/useAuth";

const Auth = () => {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AppRole>("manufacturer");

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    nav("/dashboard");
  };

  const signUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: name } },
    });
    if (error) { setLoading(false); return toast.error(error.message); }
    if (data.user) {
      // assign chosen role
      await supabase.from("user_roles").insert({ user_id: data.user.id, role });
      toast.success("Account created");
      nav("/dashboard");
    }
    setLoading(false);
  };

  const demoLogin = async (demoEmail: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: demoEmail, password: "demo1234!" });
    setLoading(false);
    if (error) return toast.error("Demo accounts not seeded yet — visit /seed");
    toast.success("Logged in");
    nav("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute inset-0 bg-gradient-glow" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8 font-display font-bold text-xl">
          <div className="size-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Leaf className="size-4 text-primary-foreground" />
          </div>
          SustainLink
        </Link>

        <div className="glass rounded-2xl p-6 shadow-elegant">
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button onClick={signIn} disabled={loading} className="w-full bg-gradient-primary hover:opacity-90">
                {loading && <Loader2 className="size-4 animate-spin" />} Sign in
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>I am a...</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as AppRole)} className="grid grid-cols-2 gap-2">
                  {(["manufacturer", "supplier", "expert"] as AppRole[]).map((r) => (
                    <label key={r} className="flex items-center gap-2 rounded-md border border-border p-2.5 cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem value={r} />
                      <span className="text-sm capitalize">{r}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <Button onClick={signUp} disabled={loading} className="w-full bg-gradient-primary hover:opacity-90">
                {loading && <Loader2 className="size-4 animate-spin" />} Create account
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 glass rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Demo accounts</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Manufacturer", email: "manufacturer@demo.sustainlink.app" },
              { label: "Supplier", email: "supplier@demo.sustainlink.app" },
              { label: "Expert", email: "expert@demo.sustainlink.app" },
              { label: "Admin", email: "admin@demo.sustainlink.app" },
            ].map((d) => (
              <Button key={d.email} variant="outline" size="sm" onClick={() => demoLogin(d.email)} disabled={loading}>
                {d.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Not seeded? <Link to="/seed" className="text-primary underline">Seed demo data</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
