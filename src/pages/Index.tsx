import { Navbar } from "@/components/Navbar";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Activity, Layers, Sparkles, CheckCircle2 } from "lucide-react";
import { TrustScore } from "@/components/TrustScore";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-glow" />
        <div className="container relative py-24 md:py-32">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <Badge variant="outline" className="mb-6 border-primary/40 bg-primary/5 text-primary font-mono text-xs">
              <Sparkles className="size-3 mr-1" /> Verified by sustainability experts
            </Badge>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
              The B2B network for <span className="glow-text">verified sustainable</span> manufacturing.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
              SustainLink connects manufacturers with audited suppliers. Every product carries a live trust score, expert reviews, and a transparent verification timeline.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow">
                <Link to="/marketplace">Explore marketplace <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Get started free</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" /> Real-time verification</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" /> Expert audits</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" /> Trust scores</span>
            </div>
          </motion.div>

          {/* Floating data card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute right-6 top-32 hidden lg:block w-80"
          >
            <div className="glass rounded-2xl p-5 shadow-elegant">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Live verification</div>
                <span className="size-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="font-display font-semibold text-base mb-1">Recycled Aluminum Sheet</div>
              <div className="text-xs text-muted-foreground mb-4">NordicGreen Metals · Sweden</div>
              <TrustScore score={92} />
              <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-2 text-xs font-mono">
                <div><div className="text-primary font-bold">12</div><div className="text-muted-foreground">Approvals</div></div>
                <div><div className="text-primary font-bold">3</div><div className="text-muted-foreground">Certs</div></div>
                <div><div className="text-primary font-bold">0</div><div className="text-muted-foreground">Flags</div></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-24 border-t border-border/50">
        <div className="max-w-2xl mb-16">
          <div className="text-xs font-mono uppercase tracking-wider text-primary mb-3">// How it works</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold">Trust, engineered into every transaction.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Layers, title: "Verified profiles", desc: "Suppliers list products with materials, claims, and uploaded certifications — auditable from day one." },
            { icon: ShieldCheck, title: "Expert validation", desc: "Independent sustainability experts review each claim and approve, reject, or request changes." },
            { icon: Activity, title: "Dynamic trust score", desc: "A live 0–100 score recomputed in real time from approvals, certifications, and rejections." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 hover:shadow-glow transition-shadow group"
            >
              <div className="size-11 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <f.icon className="size-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="glass rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-glow opacity-60" />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Ready to source with confidence?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">Join manufacturers, suppliers, and verifiers building a transparent supply chain.</p>
            <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow">
              <Link to="/auth">Create your account <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="container py-10 border-t border-border/50 text-center text-sm text-muted-foreground font-mono">
        © {new Date().getFullYear()} SustainLink — Verified Sustainable Manufacturing Network
      </footer>
    </div>
  );
};

export default Index;
