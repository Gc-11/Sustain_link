import { Link, useLocation, useNavigate } from "react-router-dom";
import { Leaf, LayoutDashboard, Store, LogIn, LogOut, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const Navbar = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const [notifs, setNotifs] = useState<{ id: string; title: string; body: string | null; read: boolean }[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id,title,body,read")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setNotifs(data ?? []);
    };
    load();
    const channel = supabase
      .channel("notif-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unread = notifs.filter((n) => !n.read).length;

  const isActive = (p: string) => location.pathname === p;

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <div className="size-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Leaf className="size-4 text-primary-foreground" />
          </div>
          <span>SustainLink</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link to="/marketplace" className={`px-3 py-2 rounded-md transition-colors ${isActive("/marketplace") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Store className="inline size-4 mr-1" /> Marketplace
          </Link>
          {user && (
            <Link to="/dashboard" className={`px-3 py-2 rounded-md transition-colors ${isActive("/dashboard") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutDashboard className="inline size-4 mr-1" /> Dashboard
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {!loading && user && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="size-4" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-pulse-glow">
                      {unread}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b border-border font-display font-semibold text-sm">Notifications</div>
                <div className="max-h-80 overflow-auto">
                  {notifs.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>
                  ) : notifs.map((n) => (
                    <div key={n.id} className="p-3 border-b border-border/50 text-sm hover:bg-muted/40">
                      <div className="font-medium flex items-center gap-2">
                        {!n.read && <span className="size-2 rounded-full bg-primary" />}
                        {n.title}
                      </div>
                      {n.body && <div className="text-muted-foreground text-xs mt-1">{n.body}</div>}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {!loading && !user && (
            <Button variant="ghost" size="sm" onClick={() => nav("/auth")}>
              <LogIn className="size-4" /> Sign in
            </Button>
          )}
          {!loading && user && (
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
