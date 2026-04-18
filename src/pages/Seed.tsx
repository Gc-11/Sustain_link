import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

const Seed = () => {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const run = async () => {
    setLoading(true);
    setLog(["Seeding..."]);
    const { data, error } = await supabase.functions.invoke("seed-demo");
    setLoading(false);
    if (error) { toast.error(error.message); setLog((l) => [...l, "Error: " + error.message]); return; }
    setLog((l) => [...l, ...(data?.log ?? ["Done."])]);
    toast.success("Demo data seeded");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container py-16 max-w-2xl">
        <div className="text-xs font-mono uppercase tracking-wider text-primary mb-2">// Setup</div>
        <h1 className="font-display text-4xl font-bold mb-3">Seed demo data</h1>
        <p className="text-muted-foreground mb-8">Creates 4 demo accounts (one per role) plus sample suppliers, products, certifications, and expert reviews. Safe to run multiple times.</p>

        <div className="glass rounded-2xl p-6">
          <Button onClick={run} disabled={loading} className="bg-gradient-primary hover:opacity-90 shadow-glow">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Seed demo data
          </Button>
          <div className="mt-4 space-y-1 font-mono text-xs">
            {log.map((l, i) => <div key={i} className="text-muted-foreground">› {l}</div>)}
          </div>
          <div className="mt-6 pt-6 border-t border-border/50 text-sm text-muted-foreground">
            <div className="font-mono uppercase tracking-wider text-xs mb-2">Demo accounts (password: <code className="text-primary">demo1234!</code>)</div>
            <ul className="space-y-1">
              <li>manufacturer@demo.sustainlink.app</li>
              <li>supplier@demo.sustainlink.app</li>
              <li>expert@demo.sustainlink.app</li>
              <li>admin@demo.sustainlink.app</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Seed;
