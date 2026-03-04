import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

export interface CustomSidebarItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  section_title: string;
  sort_order: number;
}

interface SidebarOrderState {
  section_order: string[]; // ordered section titles
  item_order: Record<string, string[]>; // section_title -> ordered item labels/ids
  custom_items: CustomSidebarItem[];
}

const DEFAULT_STATE: SidebarOrderState = {
  section_order: [],
  item_order: {},
  custom_items: [],
};

export function useSidebarOrder() {
  const [state, setState] = useState<SidebarOrderState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from Supabase
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("sidebar_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "order_config")
        .single();

      if (!cancelled) {
        if (data?.href) {
          try {
            const parsed = JSON.parse(data.href) as SidebarOrderState;
            setState(parsed);
          } catch {
            // corrupted data, use defaults
          }
        }
        setLoaded(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced save
  const save = useCallback((newState: SidebarOrderState) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        user_id: user.id,
        parent_id: null as string | null,
        label: "_sidebar_config",
        type: "order_config" as const,
        href: JSON.stringify(newState),
        icon: "Settings",
        sort_order: 0,
        is_default: false,
      };

      // Upsert using the unique constraint (user_id, parent_id, label)
      await supabase
        .from("sidebar_items")
        .upsert(payload, { onConflict: "user_id,parent_id,label" });
    }, 500);
  }, []);

  // Reorder sections
  const reorderSections = useCallback(
    (newOrder: string[]) => {
      setState((prev) => {
        const next = { ...prev, section_order: newOrder };
        save(next);
        return next;
      });
    },
    [save],
  );

  // Reorder items within a section
  const reorderItems = useCallback(
    (sectionTitle: string, newOrder: string[]) => {
      setState((prev) => {
        const next = {
          ...prev,
          item_order: { ...prev.item_order, [sectionTitle]: newOrder },
        };
        save(next);
        return next;
      });
    },
    [save],
  );

  // Move item between sections
  const moveItemToSection = useCallback(
    (
      itemLabel: string,
      fromSection: string,
      toSection: string,
      toIndex: number,
    ) => {
      setState((prev) => {
        const fromOrder = [...(prev.item_order[fromSection] || [])];
        const toOrder = [...(prev.item_order[toSection] || [])];

        // Remove from source
        const fromIdx = fromOrder.indexOf(itemLabel);
        if (fromIdx !== -1) fromOrder.splice(fromIdx, 1);

        // Add to destination
        toOrder.splice(toIndex, 0, itemLabel);

        const next = {
          ...prev,
          item_order: {
            ...prev.item_order,
            [fromSection]: fromOrder,
            [toSection]: toOrder,
          },
        };
        save(next);
        return next;
      });
    },
    [save],
  );

  // Add custom link
  const addCustomLink = useCallback(
    async (label: string, href: string, sectionTitle: string) => {
      // Validate URL
      try {
        const parsed = new URL(href);
        if (!["http:", "https:"].includes(parsed.protocol)) return;
      } catch {
        return;
      }

      const id = crypto.randomUUID();
      const item: CustomSidebarItem = {
        id,
        label,
        href,
        icon: "ExternalLink",
        section_title: sectionTitle,
        sort_order: 999,
      };

      setState((prev) => {
        const next = {
          ...prev,
          custom_items: [...prev.custom_items, item],
        };
        save(next);
        return next;
      });
    },
    [save],
  );

  // Remove custom link
  const removeCustomLink = useCallback(
    (id: string) => {
      setState((prev) => {
        const next = {
          ...prev,
          custom_items: prev.custom_items.filter((i) => i.id !== id),
        };
        save(next);
        return next;
      });
    },
    [save],
  );

  // Sort helper: apply saved order to an array
  const applySectionOrder = useCallback(
    (sectionTitles: string[]) => {
      if (state.section_order.length === 0) return sectionTitles;
      const ordered = [...sectionTitles].sort((a, b) => {
        const ai = state.section_order.indexOf(a);
        const bi = state.section_order.indexOf(b);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
      return ordered;
    },
    [state.section_order],
  );

  const applyItemOrder = useCallback(
    (sectionTitle: string, itemLabels: string[]) => {
      const order = state.item_order[sectionTitle];
      if (!order || order.length === 0) return itemLabels;
      return [...itemLabels].sort((a, b) => {
        const ai = order.indexOf(a);
        const bi = order.indexOf(b);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    },
    [state.item_order],
  );

  return {
    loaded,
    customItems: state.custom_items,
    reorderSections,
    reorderItems,
    moveItemToSection,
    addCustomLink,
    removeCustomLink,
    applySectionOrder,
    applyItemOrder,
  };
}
