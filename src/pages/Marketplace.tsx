import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TrustScore } from "@/components/TrustScore";
import { Search, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  materials: string[] | null;
  image_url: string | null;
  supplier: { id: string; company_name: string; country: string | null } | null;
  trust: { score: number } | null;
}

const Marketplace = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,description,category,materials,image_url,supplier:suppliers(id,company_name,country),trust:trust_scores(score)")
        .order("created_at", { ascending: false });
      const mapped: ProductRow[] = (data ?? []).map((p: any) => ({
        ...p,
        supplier: Array.isArray(p.supplier) ? p.supplier[0] : p.supplier,
        trust: Array.isArray(p.trust) ? p.trust[0] : p.trust,
      }));
      setProducts(mapped);
      setLoading(false);
    })();
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier?.company_name.toLowerCase().includes(search.toLowerCase()) ||
      p.materials?.some((m) => m.toLowerCase().includes(search.toLowerCase()));
    const matchesScore = (p.trust?.score ?? 0) >= minScore;
    return matchesSearch && matchesScore;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container py-10">
        <div className="mb-10">
          <div className="text-xs font-mono uppercase tracking-wider text-primary mb-2">// Marketplace</div>
          <h1 className="font-display text-4xl font-bold">Verified sustainable products</h1>
          <p className="text-muted-foreground mt-2">Browse audited supplier listings. Filter by eco-score and materials.</p>
        </div>

        <div className="glass rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search products, suppliers, materials..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 text-sm font-mono">
            <span className="text-muted-foreground">Min score</span>
            <input type="range" min={0} max={100} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="accent-primary" />
            <span className="text-primary font-bold w-8 text-right">{minScore}</span>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl h-72 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No products match your filters.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link to={`/products/${p.id}`} className="block glass rounded-2xl p-5 hover:shadow-glow transition-shadow h-full">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <Badge variant="outline" className="text-xs font-mono">{p.category ?? "Uncategorized"}</Badge>
                    <TrustScore score={p.trust?.score ?? 0} size="sm" />
                  </div>
                  <h3 className="font-display font-semibold text-lg leading-tight mb-1">{p.name}</h3>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="size-3" />
                    {p.supplier?.company_name} · {p.supplier?.country ?? "—"}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{p.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {(p.materials ?? []).slice(0, 3).map((m) => (
                      <span key={m} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{m}</span>
                    ))}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
