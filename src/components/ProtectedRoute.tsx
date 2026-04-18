import { Navigate } from "react-router-dom";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface Props { children: React.ReactNode; roles?: AppRole[]; }

export const ProtectedRoute = ({ children, roles }: Props) => {
  const { user, loading, roles: userRoles } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (roles && !roles.some((r) => userRoles.includes(r))) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};
