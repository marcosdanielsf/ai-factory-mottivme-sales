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
  section_order: string[];
  item_order: Record<string, string[]>;
  custom_items: CustomSidebarItem[];
  custom_labels: Record<string, string>; // itemKey -> custom display name (supports emoji)
  item_section_moves: Record<string, string>; // itemLabel -> target sectionKey
}

const DEFAULT_STATE: SidebarOrderState = {
  section_order: [],
  item_order: {},
  custom_items: [],
  custom_labels: {},
  item_section_moves: {},
};

export function useSidebarOrder() {
  const [state, setState] = useState<SidebarOrderState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configIdRef = useRef<string | null>(null);

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
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled) {
        if (data?.href) {
          try {
            const parsed = JSON.parse(data.href);
            setState({ ...DEFAULT_STATE, ...parsed });
            configIdRef.current = data.id;
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

  // Debounced save — uses select+update/insert because parent_id NULL breaks upsert
  const save = useCallback((newState: SidebarOrderState) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const jsonData = JSON.stringify(newState);

      if (configIdRef.current) {
        // Update existing row
        await supabase
          .from("sidebar_items")
          .update({ href: jsonData })
          .eq("id", configIdRef.current);
      } else {
        // Try to find existing row first
        const { data: existing } = await supabase
          .from("sidebar_items")
          .select("id")
          .eq("user_id", user.id)
          .eq("type", "order_config")
          .eq("label", "_sidebar_config")
          .maybeSingle();

        if (existing) {
          configIdRef.current = existing.id;
          await supabase
            .from("sidebar_items")
            .update({ href: jsonData })
            .eq("id", existing.id);
        } else {
          // Insert new row
          const { data: inserted } = await supabase
            .from("sidebar_items")
            .insert({
              user_id: user.id,
              label: "_sidebar_config",
              type: "order_config",
              href: jsonData,
              icon: "Settings",
              sort_order: 0,
              is_default: false,
            })
            .select("id")
            .single();
          if (inserted) configIdRef.current = inserted.id;
        }
      }
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
    (itemLabel: string, toSection: string) => {
      setState((prev) => {
        const newMoves = { ...prev.item_section_moves };
        if (toSection === "__reset__") {
          delete newMoves[itemLabel];
        } else {
          newMoves[itemLabel] = toSection;
        }
        // Add to target section's order
        const toOrder = [...(prev.item_order[toSection] || [])];
        if (!toOrder.includes(itemLabel)) {
          toOrder.push(itemLabel);
        }
        const next = {
          ...prev,
          item_section_moves: newMoves,
          item_order: { ...prev.item_order, [toSection]: toOrder },
        };
        save(next);
        return next;
      });
    },
    [save],
  );

  // Rename item (supports emoji)
  const renameItem = useCallback(
    (itemKey: string, newLabel: string) => {
      setState((prev) => {
        const newLabels = { ...prev.custom_labels };
        if (newLabel.trim()) {
          newLabels[itemKey] = newLabel;
        } else {
          delete newLabels[itemKey];
        }
        const next = { ...prev, custom_labels: newLabels };
        save(next);
        return next;
      });
    },
    [save],
  );

  // Add custom link
  const addCustomLink = useCallback(
    async (label: string, href: string, sectionTitle: string) => {
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

  // Sort helpers
  const applySectionOrder = useCallback(
    (sectionTitles: string[]) => {
      if (state.section_order.length === 0) return sectionTitles;
      return [...sectionTitles].sort((a, b) => {
        const ai = state.section_order.indexOf(a);
        const bi = state.section_order.indexOf(b);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
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

  const getCustomLabel = useCallback(
    (itemKey: string): string | null => {
      return state.custom_labels[itemKey] || null;
    },
    [state.custom_labels],
  );

  const getItemSection = useCallback(
    (itemLabel: string): string | null => {
      return state.item_section_moves[itemLabel] || null;
    },
    [state.item_section_moves],
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
    renameItem,
    getCustomLabel,
    getItemSection,
  };
}
