import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, session: null, roles: [], loading: true });

  useEffect(() => {
    const fetchRoles = async (userId: string) => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      return (data?.map((r) => r.role) ?? []) as AppRole[];
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({ ...prev, session, user: session?.user ?? null }));
      if (session?.user) {
        setTimeout(async () => {
          const roles = await fetchRoles(session.user.id);
          setState({ user: session.user, session, roles, loading: false });
        }, 0);
      } else {
        setState({ user: null, session: null, roles: [], loading: false });
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const roles = await fetchRoles(session.user.id);
        setState({ user: session.user, session, roles, loading: false });
      } else {
        setState({ user: null, session: null, roles: [], loading: false });
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return { ...state, signOut, hasRole: (r: AppRole) => state.roles.includes(r) };
}
