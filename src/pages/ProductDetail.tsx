import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { TrustScore } from "@/components/TrustScore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ShieldCheck, ShieldX, MessageSquare, Award, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";

type ReviewStatus = Database["public"]["Enums"]["review_status"];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [trust, setTrust] = useState<{ score: number; approvals: number; rejections: number; total_reviews: number } | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!id) return;
    const [p, r, t] = await Promise.all([
      supabase.from("products").select("*,supplier:suppliers(*),certifications(*)").eq("id", id).single(),
      supabase.from("expert_reviews").select("*,expert:profiles!expert_reviews_expert_id_fkey(full_name)").eq("product_id", id).order("created_at", { ascending: false }),
      supabase.from("trust_scores").select("*").eq("product_id", id).maybeSingle(),
    ]);
    setProduct(p.data);
    setReviews(r.data ?? []);
    setTrust(t.data);
  };

  useEffect(() => {
    load();
    if (!id) return;
    const channel = supabase
      .channel(`product-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expert_reviews", filter: `product_id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "trust_scores", filter: `product_id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const submitReview = async (status: ReviewStatus) => {
    if (!user || !id) return;
    setSubmitting(true);
    const { error } = await supabase.from("expert_reviews").insert({ product_id: id, expert_id: user.id, status, comments: comment || null });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Review submitted");
    setComment("");
  };

  if (!product) return <div className="min-h-screen"><Navbar /><div className="container py-20 text-center text-muted-foreground"><Loader2 className="size-6 animate-spin mx-auto" /></div></div>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container py-10 grid lg:grid-cols-3 gap-6">
        {/* main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <Badge variant="outline" className="font-mono text-xs mb-3">{product.category ?? "Uncategorized"}</Badge>
                <h1 className="font-display text-4xl font-bold">{product.name}</h1>
                <p className="text-muted-foreground mt-1">by <span className="text-foreground font-medium">{product.supplier?.company_name}</span> · {product.supplier?.country}</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Materials</div>
              <div className="flex flex-wrap gap-2">
                {(product.materials ?? []).map((m: string) => (
                  <span key={m} className="text-xs font-mono px-2.5 py-1 rounded-full bg-muted">{m}</span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Sustainability claims</div>
              <p className="text-sm">{product.sustainability_claims}</p>
            </div>
          </div>

          {/* Verification timeline */}
          <div className="glass rounded-2xl p-8">
            <h2 className="font-display text-xl font-semibold mb-1">Verification timeline</h2>
            <p className="text-sm text-muted-foreground mb-6">Live updates from sustainability experts.</p>
            {reviews.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-xl">No reviews yet — pending expert verification.</div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`size-8 rounded-full flex items-center justify-center ${r.status === "approved" ? "bg-primary/15 text-primary" : r.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>
                        {r.status === "approved" ? <ShieldCheck className="size-4" /> : r.status === "rejected" ? <ShieldX className="size-4" /> : <MessageSquare className="size-4" />}
                      </div>
                      {i < reviews.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{r.expert?.full_name ?? "Expert"}</span>
                        <Badge variant="outline" className="text-[10px] font-mono uppercase">{r.status.replace("_", " ")}</Badge>
                        <span className="text-xs text-muted-foreground font-mono">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      {r.comments && <p className="text-sm text-muted-foreground mt-1">{r.comments}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Expert review form */}
          {hasRole("expert") && (
            <div className="glass rounded-2xl p-6 border-primary/30">
              <h3 className="font-display font-semibold mb-3">Submit expert review</h3>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Notes, evidence, or required changes..." className="mb-3" />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => submitReview("approved")} disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <ShieldCheck className="size-4" /> Approve
                </Button>
                <Button onClick={() => submitReview("changes_requested")} disabled={submitting} variant="outline">
                  <MessageSquare className="size-4" /> Request changes
                </Button>
                <Button onClick={() => submitReview("rejected")} disabled={submitting} variant="outline" className="text-destructive border-destructive/40">
                  <ShieldX className="size-4" /> Reject
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* sidebar */}
        <div className="space-y-5">
          <div className="glass rounded-2xl p-6">
            <TrustScore score={trust?.score ?? 0} />
            <div className="grid grid-cols-3 gap-3 mt-5 text-center">
              <div><div className="text-2xl font-display font-bold text-primary">{trust?.approvals ?? 0}</div><div className="text-[10px] font-mono uppercase text-muted-foreground">Approvals</div></div>
              <div><div className="text-2xl font-display font-bold text-destructive">{trust?.rejections ?? 0}</div><div className="text-[10px] font-mono uppercase text-muted-foreground">Rejections</div></div>
              <div><div className="text-2xl font-display font-bold">{trust?.total_reviews ?? 0}</div><div className="text-[10px] font-mono uppercase text-muted-foreground">Total</div></div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3"><Award className="size-4 text-primary" /><h3 className="font-display font-semibold">Certifications</h3></div>
            {(product.certifications ?? []).length === 0 ? (
              <div className="text-sm text-muted-foreground">No certifications uploaded.</div>
            ) : (
              <ul className="space-y-2">
                {product.certifications.map((c: any) => (
                  <li key={c.id} className="text-sm flex items-center justify-between gap-2 p-2 rounded-md bg-muted/40">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      {c.issuer && <div className="text-xs text-muted-foreground">{c.issuer}</div>}
                    </div>
                    {c.file_url && <a href={c.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View</a>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
