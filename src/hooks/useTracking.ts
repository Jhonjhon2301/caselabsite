import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { initTracking } from "@/lib/tracking";

/**
 * Hook to initialize tracking (Meta Pixel + GA4) from site_settings.
 * Place once in App or main layout.
 */
export function useTrackingInit() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "tracking_config")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          const config = data.value as Record<string, string>;
          initTracking({
            meta_pixel_id: config.meta_pixel_id,
            ga4_id: config.ga4_id,
          });
        }
      });
  }, []);
}
