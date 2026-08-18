"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export default function SessionProvider({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  const [supabase] = useState(() => createClient());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const set = async () => {
      try {
        if (session) {
          const { error } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          if (error) {
            await supabase.auth.refreshSession({
              refresh_token: session.refresh_token,
            });
          }
        }
      } catch {
        // ignore
      } finally {
        setReady(true);
      }
    };
    set();
  }, [session, supabase]);

  if (!ready) {
    return <div className="p-6 text-sm text-t2">Loading session...</div>;
  }

  return <>{children}</>;
}
