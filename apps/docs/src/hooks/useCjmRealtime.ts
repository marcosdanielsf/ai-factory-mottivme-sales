import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { CjmBroadcastPayload } from "../types/cjm";

export const useCjmRealtime = (
  onStageChange: (payload: CjmBroadcastPayload) => void,
  refetch: () => void,
  enabled = true,
) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(onStageChange);
  const refetchRef = useRef(refetch);

  // Keep refs up to date without re-creating channel
  callbackRef.current = onStageChange;
  refetchRef.current = refetch;

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to Broadcast channel
    const channel = supabase
      .channel("cjm-events")
      .on("broadcast", { event: "stage_change" }, (payload) => {
        callbackRef.current(payload.payload as CjmBroadcastPayload);
      })
      .subscribe((status) => {
        setIsSubscribed(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    // 30s polling fallback — ensures map updates even without Broadcast node in n8n
    const intervalId = setInterval(() => {
      refetchRef.current();
    }, 30000);

    return () => {
      clearInterval(intervalId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsSubscribed(false);
    };
  }, [enabled]);

  return { isSubscribed };
};
