import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;
        receivedEvent = true;
        setError(null);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!active || receivedEvent) return;
      setError(error);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((cause: unknown) => {
      if (!active || receivedEvent) return;
      setError(cause instanceof Error ? cause : new Error("Falha ao carregar sessão"));
      setLoading(false);
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, error, signOut };
}
