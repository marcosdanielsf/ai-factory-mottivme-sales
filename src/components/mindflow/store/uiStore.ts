import { create } from "zustand";

type PanelTab = "tasks" | "ai" | "overview" | "comments";
type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UIStore {
  // Panels
  rightPanelOpen: boolean;
  activeTab: PanelTab;

  // Modals
  copilotOpen: boolean;
  emojiPickerOpen: boolean;
  imageUploadOpen: boolean;
  exportOpen: boolean;
  templatesOpen: boolean;

  // Presentation mode
  presentationMode: boolean;
  presentationNodeId: string | null;

  // Save status indicator
  saveStatus: SaveStatus;

  // Panel actions
  openRightPanel: (tab?: PanelTab) => void;
  closeRightPanel: () => void;
  setActiveTab: (tab: PanelTab) => void;

  // Modal actions
  openCopilot: () => void;
  closeCopilot: () => void;
  openEmojiPicker: () => void;
  closeEmojiPicker: () => void;
  openImageUpload: () => void;
  closeImageUpload: () => void;
  openExport: () => void;
  closeExport: () => void;
  openTemplates: () => void;
  closeTemplates: () => void;

  // Presentation actions
  enterPresentation: (nodeId?: string) => void;
  exitPresentation: () => void;
  setPresentationNode: (nodeId: string) => void;

  // Save status
  setSaveStatus: (status: SaveStatus) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  rightPanelOpen: true,
  activeTab: "tasks",
  copilotOpen: false,
  emojiPickerOpen: false,
  imageUploadOpen: false,
  exportOpen: false,
  templatesOpen: false,
  presentationMode: false,
  presentationNodeId: null,
  saveStatus: "idle",

  openRightPanel: (tab) =>
    set({ rightPanelOpen: true, ...(tab ? { activeTab: tab } : {}) }),
  closeRightPanel: () => set({ rightPanelOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  openCopilot: () => set({ copilotOpen: true }),
  closeCopilot: () => set({ copilotOpen: false }),
  openEmojiPicker: () => set({ emojiPickerOpen: true }),
  closeEmojiPicker: () => set({ emojiPickerOpen: false }),
  openImageUpload: () => set({ imageUploadOpen: true }),
  closeImageUpload: () => set({ imageUploadOpen: false }),
  openExport: () => set({ exportOpen: true }),
  closeExport: () => set({ exportOpen: false }),
  openTemplates: () => set({ templatesOpen: true }),
  closeTemplates: () => set({ templatesOpen: false }),

  enterPresentation: (nodeId) =>
    set({
      presentationMode: true,
      presentationNodeId: nodeId ?? null,
      rightPanelOpen: false,
    }),
  exitPresentation: () =>
    set({ presentationMode: false, presentationNodeId: null }),
  setPresentationNode: (nodeId) => set({ presentationNodeId: nodeId }),

  setSaveStatus: (status) => set({ saveStatus: status }),
}));
