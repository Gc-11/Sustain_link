import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export const TrustScore = ({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) => {
  const tone = score >= 75 ? "primary" : score >= 50 ? "accent" : "warning";
  const Icon = score >= 75 ? ShieldCheck : ShieldAlert;
  const label = score >= 75 ? "Verified" : score >= 50 ? "Reviewed" : "Pending";

  if (size === "sm") {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-mono">
        <Icon className={`size-3.5 text-${tone}`} />
        <span className={`text-${tone} font-semibold`}>{score}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-muted-foreground">
          <Icon className={`size-3.5 text-${tone}`} /> Trust score
        </div>
        <div className={`font-mono font-bold text-${tone}`}>{score}/100 · {label}</div>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  );
};
