import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrustScore } from "@/components/TrustScore";
import { ShieldCheck, Package, Users, ClipboardCheck } from "lucide-react";

const Dashboard = () => {
  const { user, roles } = useAuth();
  const primaryRole = roles[0] ?? "manufacturer";
  const [data, setData] = useState<any>({ products: [], reviews: [], pending: [], users: [] });

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (roles.includes("supplier")) {
        const { data: supplier } = await supabase.from("suppliers").select("id,company_name").eq("user_id", user.id).maybeSingle();
        if (supplier) {
          const { data: products } = await supabase
            .from("products")
            .select("id,name,category,trust:trust_scores(score)")
            .eq("supplier_id", supplier.id);
          setData((d: any) => ({ ...d, supplier, products: products ?? [] }));
        }
      }
      if (roles.includes("expert")) {
        const { data: pending } = await supabase
          .from("products")
          .select("id,name,supplier:suppliers(company_name),trust:trust_scores(score)")
          .order("created_at", { ascending: false })
          .limit(20);
        setData((d: any) => ({ ...d, pending: pending ?? [] }));
      }
      if (roles.includes("manufacturer")) {
        const { data: saved } = await supabase
          .from("saved_suppliers")
          .select("supplier:suppliers(id,company_name,country)")
          .eq("user_id", user.id);
        setData((d: any) => ({ ...d, saved: saved ?? [] }));
      }
      if (roles.includes("admin")) {
        const [{ data: users }, { data: products }] = await Promise.all([
          supabase.from("profiles").select("id,full_name,created_at").limit(50),
          supabase.from("products").select("id,name,supplier:suppliers(company_name)").limit(50),
        ]);
        setData((d: any) => ({ ...d, users: users ?? [], products: products ?? [] }));
      }
    })();
  }, [user, roles.join(",")]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-xs font-mono uppercase tracking-wider text-primary">// Dashboard</div>
          {roles.map((r) => <Badge key={r} variant="outline" className="font-mono text-xs capitalize">{r}</Badge>)}
        </div>
        <h1 className="font-display text-4xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-1">{user?.email}</p>

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          {roles.includes("supplier") && (
            <div className="glass rounded-2xl p-6 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4"><Package className="size-4 text-primary" /><h2 className="font-display font-semibold">Your products</h2></div>
              {data.products?.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">No products listed yet.</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {data.products?.map((p: any) => (
                    <Link key={p.id} to={`/products/${p.id}`} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/60 transition">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-medium text-sm">{p.name}</div>
                        <TrustScore score={(Array.isArray(p.trust) ? p.trust[0]?.score : p.trust?.score) ?? 0} size="sm" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">{p.category ?? "—"}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {roles.includes("expert") && (
            <div className="glass rounded-2xl p-6 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4"><ClipboardCheck className="size-4 text-primary" /><h2 className="font-display font-semibold">Review queue</h2></div>
              <div className="grid sm:grid-cols-2 gap-3">
                {data.pending?.map((p: any) => (
                  <Link key={p.id} to={`/products/${p.id}`} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/60 transition flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{(Array.isArray(p.supplier) ? p.supplier[0] : p.supplier)?.company_name}</div>
                    </div>
                    <TrustScore score={(Array.isArray(p.trust) ? p.trust[0]?.score : p.trust?.score) ?? 0} size="sm" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {roles.includes("manufacturer") && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4"><ShieldCheck className="size-4 text-primary" /><h2 className="font-display font-semibold">Saved suppliers</h2></div>
              {(data.saved ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground py-6">
                  None saved yet. <Link to="/marketplace" className="text-primary underline">Browse marketplace</Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {data.saved.map((s: any, i: number) => {
                    const sup = Array.isArray(s.supplier) ? s.supplier[0] : s.supplier;
                    return <li key={i} className="p-3 rounded-md bg-muted/30 text-sm">{sup?.company_name} · {sup?.country}</li>;
                  })}
                </ul>
              )}
            </div>
          )}

          {roles.includes("admin") && (
            <div className="glass rounded-2xl p-6 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4"><Users className="size-4 text-primary" /><h2 className="font-display font-semibold">Platform users</h2></div>
              <div className="grid md:grid-cols-2 gap-2">
                {data.users?.map((u: any) => (
                  <div key={u.id} className="p-3 rounded-md bg-muted/30 text-sm flex justify-between">
                    <span>{u.full_name ?? u.id.slice(0, 8)}</span>
                    <span className="text-xs text-muted-foreground font-mono">{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {roles.length === 0 && (
            <div className="glass rounded-2xl p-6 lg:col-span-2 text-center">
              <p className="text-muted-foreground mb-4">No role assigned. Visit the marketplace to browse.</p>
              <Button asChild><Link to="/marketplace">Go to marketplace</Link></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
